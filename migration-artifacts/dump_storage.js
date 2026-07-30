#!/usr/bin/env node
/**
 * Download storage objects into migration-artifacts/storage.
 * Usage: node migration-artifacts/dump_storage.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const OUT = path.join(__dirname, "storage");
const BUCKETS = ["products", "avatars", "blog", "media", "reviews"];

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
if (!URL_ || !KEY) throw new Error("Missing Supabase credentials in .env.local");

async function listAll(bucket, prefix = "") {
  const res = await fetch(`${URL_}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix, limit: 1000 }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function download(bucket, objectPath, attempt = 1) {
  const dest = path.join(OUT, bucket, objectPath);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    console.log(`  skip ${bucket}/${objectPath}`);
    return;
  }
  try {
    const res = await fetch(`${URL_}/storage/v1/object/${bucket}/${objectPath}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) {
      console.log(`  FAIL ${bucket}/${objectPath}: ${res.status}`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    console.log(`  ok ${bucket}/${objectPath} (${buf.length}b)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attempt < 5) {
      console.log(`  retry ${bucket}/${objectPath} (${attempt}) ${msg}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return download(bucket, objectPath, attempt + 1);
    }
    console.log(`  FAIL ${bucket}/${objectPath}: ${msg}`);
  }
}

async function walk(bucket, prefix = "") {
  const items = await listAll(bucket, prefix);
  if (items === null) {
    console.log(`bucket ${bucket}: not found / inaccessible`);
    return;
  }
  for (const item of items) {
    const name = item.name;
    if (!name) continue;
    const full = prefix ? `${prefix}/${name}` : name;
    if (item.id === null || item.metadata === null) {
      await walk(bucket, full);
    } else {
      await download(bucket, full);
    }
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const bucket of BUCKETS) {
    console.log(`==> ${bucket}`);
    await walk(bucket);
  }
  console.log("DONE", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
