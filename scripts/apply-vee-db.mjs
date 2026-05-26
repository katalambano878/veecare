/**
 * Apply all migrations to Vee Care Supabase via exec_sql RPC or execute chunks.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf-8')
      .split('\n')
      .filter((l) => /^[A-Z_]+=/.test(l.trim()))
      .map((l) => {
        const eq = l.indexOf('=');
        let val = l.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        return [l.slice(0, eq).trim(), val];
      })
  );
}

const env = { ...process.env, ...loadEnv() };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const chunks = [
  { file: '.chunk1.sql', label: 'tables' },
  { file: '.chunk2.sql', label: 'functions' },
  { file: '.chunk3.sql', label: 'indexes' },
  { file: '.chunk4.sql', label: 'rls' },
  { file: path.join('..', 'supabase/migrations/20260218000000_allow_null_order_items_product_fks.sql'), label: 'order_items_null' },
  { file: path.join('..', 'supabase/migrations/20260219000000_contact_submissions.sql'), label: 'contact' },
].map((c) => ({
  ...c,
  file: c.file.startsWith('..') ? path.join(__dirname, c.file) : path.join(__dirname, c.file),
}));

async function runSql(sql, label) {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) throw new Error(`${label}: ${error.message}`);
  console.log(`OK: ${label}`);
}

async function main() {
  const reordered = path.join(__dirname, '_mcp_reordered_schema.sql');
  if (fs.existsSync(reordered)) {
    console.log('Trying full schema via exec_sql...');
    try {
      await runSql(fs.readFileSync(reordered, 'utf-8'), 'full_schema');
      console.log('Full schema applied.');
      return;
    } catch (e) {
      console.log('exec_sql full failed:', e.message, '\nTrying chunks...');
    }
  }

  for (const { file, label } of chunks) {
    if (!fs.existsSync(file)) {
      console.warn('Skip missing', file);
      continue;
    }
    const sql = fs.readFileSync(file, 'utf-8');
    try {
      await runSql(sql, label);
    } catch (e) {
      if (e.message?.includes('already exists')) {
        console.log(`Skip (exists): ${label}`);
      } else {
        throw e;
      }
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
