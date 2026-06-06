/**
 * Apply SQL chunks via Postgres (requires DATABASE_URL in env or .env.local).
 * Fallback when MCP apply_migration cannot be invoked from shell.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.error(
    'Missing DATABASE_URL. Set it in .env.local (Supabase → Settings → Database → Connection string, URI).'
  );
  process.exit(1);
}

const { Client } = await import('pg');
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

const chunks = [1, 2, 3, 4].map((n) =>
  JSON.parse(fs.readFileSync(path.join(dir, `mcp-payload-${n}.json`), 'utf8'))
);

await client.connect();
try {
  for (const { name, query } of chunks) {
    console.log(`Applying ${name} (${query.length} chars)...`);
    await client.query(query);
    console.log(`OK: ${name}`);
  }
  const migrations = [
    '20260218000000_allow_null_order_items_product_fks.sql',
    '20260219000000_contact_submissions.sql',
    '20260528180000_ai_chat_memory_and_kb.sql',
  ];
  for (const file of migrations) {
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8');
    const name = file.replace(/^\d+_/, '').replace('.sql', '');
    console.log(`Applying ${name}...`);
    await client.query(sql);
    console.log(`OK: ${name}`);
  }
} finally {
  await client.end();
}
console.log('All migrations applied.');
