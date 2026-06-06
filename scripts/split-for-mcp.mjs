import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const part1 = fs.readFileSync(path.join(dir, '_mcp_part1.sql'), 'utf8');
const part2 = fs.readFileSync(path.join(dir, '_mcp_part2.sql'), 'utf8');

const splitAt = (sql, marker, name) => {
  const i = sql.indexOf(marker);
  if (i < 0) throw new Error(`marker not found: ${marker}`);
  return [sql.slice(0, i).trim(), sql.slice(i).trim()];
};

const [p1a, p1b] = splitAt(part1, '-- 3. HELPER FUNCTIONS');
const [p2a, p2b] = splitAt(part2, '-- 7. ENABLE ROW LEVEL SECURITY');

const chunks = [
  { name: 'complete_schema_extensions_enums_tables', query: p1a },
  { name: 'complete_schema_functions', query: p1b },
  { name: 'complete_schema_indexes_triggers', query: p2a },
  { name: 'complete_schema_rls_storage', query: p2b },
];

chunks.forEach((c, i) => {
  const file = path.join(dir, `_mcp_chunk_${i + 1}.sql`);
  fs.writeFileSync(file, c.query);
  console.log(c.name, c.query.length, '->', path.basename(file));
});
