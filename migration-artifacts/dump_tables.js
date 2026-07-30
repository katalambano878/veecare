#!/usr/bin/env node
/**
 * Dump public tables from live Supabase via PostgREST (service role).
 * Usage: node migration-artifacts/dump_tables.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const OUT = path.join(__dirname, "dumps");

function loadEnv() {
  const env = { ...process.env };
  for (const name of [".env.local", ".env", "env.local"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in env) || !env[k]) env[k] = v;
    }
  }
  return env;
}

const env = loadEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const TABLES = [
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

async function dumpTable(t) {
  const rows = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const res = await fetch(`${URL_}/rest/v1/${t}?select=*`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Range: `${from}-${from + page - 1}`,
        Prefer: "count=exact",
      },
    });
    if (!res.ok) {
      const body = await res.text();
      console.log(`  ${t}: HTTP ${res.status} ${body.slice(0, 160)}`);
      return null;
    }
    const chunk = await res.json();
    rows.push(...chunk);
    if (chunk.length < page) break;
    from += page;
  }
  return rows;
}

async function dumpAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const res = await fetch(
      `${URL_}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
        },
      }
    );
    if (!res.ok) {
      console.log(`  auth.users: HTTP ${res.status}`);
      return null;
    }
    const body = await res.json();
    const batch = body.users || body || [];
    if (!Array.isArray(batch) || batch.length === 0) break;
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const inventory = { dumpedAt: new Date().toISOString(), source: URL_, tables: {} };

  const authUsers = await dumpAuthUsers();
  if (authUsers) {
    fs.writeFileSync(path.join(OUT, "auth_users.json"), JSON.stringify(authUsers, null, 1));
    inventory.tables.auth_users = authUsers.length;
    console.log(`auth_users: ${authUsers.length} (no password hashes via Admin API)`);
  }

  for (const t of TABLES) {
    const rows = await dumpTable(t);
    if (rows === null) continue;
    fs.writeFileSync(path.join(OUT, `${t}.json`), JSON.stringify(rows, null, 1));
    inventory.tables[t] = rows.length;
    console.log(`${t}: ${rows.length}`);
  }

  fs.writeFileSync(path.join(OUT, "_inventory.json"), JSON.stringify(inventory, null, 2));
  console.log("DONE", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
