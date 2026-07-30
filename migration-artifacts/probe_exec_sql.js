#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i)] = t.slice(i + 1);
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  for (const body of [
    { sql_query: "select count(*)::int as n from auth.users" },
    { query: "select count(*)::int as n from auth.users" },
  ]) {
    for (const fn of ["exec_sql", "execute_sql"]) {
      const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      console.log(fn, JSON.stringify(body), r.status, (await r.text()).slice(0, 180));
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
