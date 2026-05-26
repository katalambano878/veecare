/**
 * Prints migration payloads for agent MCP apply_migration (one JSON line per chunk).
 * Run: node scripts/mcp-apply-all.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const jobs = [
  ['complete_schema_extensions_enums_tables', '.chunk1.sql'],
  ['complete_schema_functions', '.chunk2.sql'],
  ['complete_schema_indexes_triggers', '.chunk3.sql'],
  ['complete_schema_rls_storage', '.chunk4.sql'],
  ['allow_null_order_items_product_fks', path.join('..', 'supabase/migrations/20260218000000_allow_null_order_items_product_fks.sql')],
  ['contact_submissions', path.join('..', 'supabase/migrations/20260219000000_contact_submissions.sql')],
];

for (const [name, file] of jobs) {
  const p = file.startsWith('..') ? path.join(dir, file) : path.join(dir, file);
  const query = fs.readFileSync(p, 'utf8');
  console.log(JSON.stringify({ name, query, bytes: query.length }));
}
