/**
 * Prints migration chunks as JSON lines for MCP apply_migration (stdin pipe).
 * Usage: node scripts/apply-via-mcp-chunks.mjs [1-4|all]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2] || 'all';
const nums = n === 'all' ? [1, 2, 3, 4] : [Number(n)];

for (const i of nums) {
  const payload = JSON.parse(
    fs.readFileSync(path.join(dir, `mcp-payload-${i}.json`), 'utf8')
  );
  process.stdout.write(JSON.stringify(payload) + '\n');
}
