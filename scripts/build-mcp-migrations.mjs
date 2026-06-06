/**
 * Build schema SQL for fresh Supabase: tables before functions (avoids relation errors).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260209000000_complete_schema.sql'),
  'utf8'
);

const lines = src.split(/\r?\n/);

const header = lines.slice(0, 31); // through enums
const functionsBlock = lines.slice(31, 262); // section 3 helper functions
const tablesBlock = lines.slice(262, 727); // section 4 tables
const markOrderPaid = lines.slice(728, 789);
const tail = lines.slice(790); // indexes, triggers, RLS, storage

const reordered = [
  ...header,
  ...tablesBlock,
  ...functionsBlock,
  ...markOrderPaid,
  ...tail,
].join('\n');

const out = path.join(root, 'scripts', '_mcp_reordered_schema.sql');
fs.writeFileSync(out, reordered);
console.log('Wrote', out, 'bytes:', reordered.length);
