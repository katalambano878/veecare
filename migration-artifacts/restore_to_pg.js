#!/usr/bin/env node
/**
 * Restore JSON dumps into plain Postgres (store_veecare).
 * Usage:
 *   DATABASE_URL=postgres://... node migration-artifacts/restore_to_pg.js
 * Or set DIRECT_URL / DATABASE_URL in env.
 *
 * Auth users: Admin API dump has no password hashes. Set RESTORE_TEMP_PASSWORD
 * to apply one temporary bcrypt password to all imported users (they should reset).
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const DUMP = path.join(__dirname, "dumps");
const OLD_STORAGE_PREFIX =
  process.env.OLD_STORAGE_PREFIX ||
  "https://kczglollrtoyhidvgxoj.supabase.co/storage/v1/object/public";
const NEW_STORAGE_PREFIX =
  process.env.NEW_STORAGE_PREFIX || "/storage/v1/object/public";

const ORDER = [
  "profiles",
  "addresses",
  "store_settings",
  "audit_logs",
  "categories",
  "products",
  "product_images",
  "product_variants",
  "coupons",
  "customers",
  "orders",
  "order_items",
  "order_status_history",
  "cart_items",
  "wishlist_items",
  "reviews",
  "review_images",
  "blog_posts",
  "support_tickets",
  "support_messages",
  "return_requests",
  "return_items",
  "notifications",
  "pages",
  "site_settings",
  "cms_content",
  "banners",
  "navigation_menus",
  "navigation_items",
  "store_modules",
  "contact_submissions",
  "chat_conversations",
  "ai_memory",
  "customer_insights",
  "support_knowledge_base",
  "affiliates",
  "affiliate_commissions",
];

function loadJson(name) {
  const p = path.join(DUMP, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function rewriteValue(v) {
  if (typeof v === "string" && v.includes(OLD_STORAGE_PREFIX)) {
    return v.split(OLD_STORAGE_PREFIX).join(NEW_STORAGE_PREFIX);
  }
  if (Array.isArray(v)) return v.map(rewriteValue);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = rewriteValue(val);
    return out;
  }
  return v;
}

async function upsertAuthUsers(client, users, tempPassword) {
  if (!users?.length) return 0;
  const hash = bcrypt.hashSync(tempPassword || "ChangeMeNow!123", 10);
  let n = 0;
  for (const u of users) {
    const meta = u.user_metadata || u.raw_user_meta_data || {};
    const appMeta = u.app_metadata || u.raw_app_meta_data || {
      provider: "email",
      providers: ["email"],
    };
    await client.query(
      `INSERT INTO auth.users (
         id, instance_id, aud, role, email, encrypted_password,
         email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
         created_at, updated_at, phone, confirmation_token, recovery_token,
         email_change_token_new, email_change, is_sso_user, is_anonymous
       ) VALUES (
         $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         $2, $3, COALESCE($4::timestamptz, now()), $5::jsonb, $6::jsonb,
         COALESCE($7::timestamptz, now()), COALESCE($8::timestamptz, now()),
         $9, '', '', '', '', false, false
       )
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         encrypted_password = COALESCE(auth.users.encrypted_password, EXCLUDED.encrypted_password),
         raw_app_meta_data = EXCLUDED.raw_app_meta_data,
         raw_user_meta_data = EXCLUDED.raw_user_meta_data,
         updated_at = now()`,
      [
        u.id,
        (u.email || "").toLowerCase(),
        hash,
        u.email_confirmed_at || u.confirmed_at || null,
        JSON.stringify(appMeta),
        JSON.stringify(meta),
        u.created_at || null,
        u.updated_at || null,
        u.phone || null,
      ]
    );
    n += 1;
  }
  return n;
}

async function insertTable(client, table, rows) {
  if (!rows?.length) return 0;
  let inserted = 0;
  for (const row of rows) {
    const clean = rewriteValue(row);
    const cols = Object.keys(clean);
    if (!cols.length) continue;
    const vals = cols.map((c) => clean[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO public.${table} (${cols.map((c) => `"${c}"`).join(",")})
                 VALUES (${placeholders.join(",")})
                 ON CONFLICT DO NOTHING`;
    try {
      // text[] stay arrays; jsonb objects stringify once; already-string JSON left as-is
      const mapped = vals.map((v) => {
        if (v === null || v === undefined) return v;
        if (v instanceof Date) return v;
        if (Array.isArray(v)) {
          // arrays of objects (jsonb) → stringify; primitive arrays (text[]) keep
          if (v.some((x) => x && typeof x === "object")) return JSON.stringify(v);
          return v;
        }
        if (typeof v === "object") return JSON.stringify(v);
        return v;
      });
      await client.query(sql, mapped);
      inserted += 1;
    } catch (err) {
      console.error(`  ${table} row failed:`, err.message.slice(0, 160));
    }
  }
  return inserted;
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error("Set DATABASE_URL (or DIRECT_URL) to store_veecare");
  }

  const tempPassword = process.env.RESTORE_TEMP_PASSWORD || "ChangeMeNow!123";
  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  console.log("Connected");

  // Prefer replica role (superuser) so triggers like handle_new_user don't double-insert.
  try {
    await client.query("SET session_replication_role = replica");
    console.log("session_replication_role=replica");
  } catch {
    console.log("session_replication_role not permitted — continuing without it");
  }

  const authUsers = loadJson("auth_users.json");
  const authN = await upsertAuthUsers(client, authUsers, tempPassword);
  console.log(`auth.users: ${authN} (temp password applied where missing)`);

  for (const table of ORDER) {
    const rows = loadJson(`${table}.json`);
    if (!rows) {
      console.log(`${table}: skip (no dump)`);
      continue;
    }
    const n = await insertTable(client, table, rows);
    console.log(`${table}: ${n}/${rows.length}`);
  }

  try {
    await client.query("SET session_replication_role = DEFAULT");
  } catch {
    /* ignore */
  }

  // Ensure sequences / identity not needed for uuid PKs
  const counts = await client.query(`
    SELECT
      (SELECT count(*) FROM auth.users) AS auth_users,
      (SELECT count(*) FROM profiles) AS profiles,
      (SELECT count(*) FROM products) AS products,
      (SELECT count(*) FROM orders) AS orders,
      (SELECT count(*) FROM customers) AS customers,
      (SELECT count(*) FROM order_items) AS order_items
  `);
  console.log("COUNTS", counts.rows[0]);
  console.log("TEMP_PASSWORD_FOR_IMPORTED_USERS:", tempPassword);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
