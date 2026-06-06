#!/usr/bin/env node
/**
 * Prints migration payloads as JSON lines for MCP apply_migration.
 * Usage: node scripts/apply-migrations-mcp.mjs <step 1-7>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const steps = [
  { file: 'scripts/_mcp_chunk_1.sql', name: 'complete_schema_extensions_enums_tables' },
  { file: 'scripts/_mcp_chunk_2.sql', name: 'complete_schema_functions' },
  { file: 'scripts/_mcp_chunk_3.sql', name: 'complete_schema_indexes_triggers' },
  { file: 'scripts/_mcp_chunk_4.sql', name: 'complete_schema_rls_storage' },
  {
    file: 'supabase/migrations/20260218000000_allow_null_order_items_product_fks.sql',
    name: 'allow_null_order_items_product_fks',
  },
  {
    file: 'supabase/migrations/20260219000000_contact_submissions.sql',
    name: 'contact_submissions',
  },
  {
    file: 'supabase/migrations/20260528180000_ai_chat_memory_and_kb.sql',
    name: 'ai_chat_memory_and_kb',
  },
];

const step = parseInt(process.argv[2] || '1', 10);
const s = steps[step - 1];
if (!s) {
  console.error('Invalid step', step);
  process.exit(1);
}
const query = fs.readFileSync(path.join(root, s.file), 'utf8');
process.stdout.write(JSON.stringify({ name: s.name, query }));
