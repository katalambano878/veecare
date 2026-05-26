#!/usr/bin/env node
/** Prints migration name and query for a step (1-6) to stdout as JSON for MCP. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const step = parseInt(process.argv[2] || '3', 10);
const names = [
  'complete_schema_extensions_enums_tables',
  'complete_schema_functions',
  'complete_schema_indexes_triggers',
  'complete_schema_rls_storage',
  'allow_null_order_items_product_fks',
  'contact_submissions',
];
const name = names[step - 1];
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const payloadPath = path.join(root, 'scripts', `_mcp_${name}.json`);
const { query } = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
process.stdout.write(JSON.stringify({ name, query }));
