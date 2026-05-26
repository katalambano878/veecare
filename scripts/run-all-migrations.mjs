#!/usr/bin/env node
/**
 * Apply all 6 migrations via Supabase MCP-style API using node + fs.
 * Prints results as JSON for reporting.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const steps = [
  { file: 'scripts/.chunk1.sql', name: 'complete_schema_extensions_enums_tables' },
  { file: 'scripts/.chunk2.sql', name: 'complete_schema_functions' },
  { file: 'scripts/.chunk3.sql', name: 'complete_schema_indexes_triggers' },
  { file: 'scripts/.chunk4.sql', name: 'complete_schema_rls_storage' },
  {
    file: 'supabase/migrations/20260218000000_allow_null_order_items_product_fks.sql',
    name: 'allow_null_order_items_product_fks',
  },
  {
    file: 'supabase/migrations/20260219000000_contact_submissions.sql',
    name: 'contact_submissions',
  },
];

const results = [];

for (const step of steps) {
  const query = fs.readFileSync(path.join(root, step.file), 'utf8');
  const payload = JSON.stringify({ name: step.name, query });
  const payloadPath = path.join(root, 'scripts', `_mcp_${step.name}.json`);
  fs.writeFileSync(payloadPath, payload);
  results.push({ step: step.name, payloadPath, queryLength: query.length });
}

console.log(JSON.stringify(results, null, 2));
