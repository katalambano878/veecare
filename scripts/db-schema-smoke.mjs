#!/usr/bin/env node
/**
 * Schema smoke test — requires DATABASE_URL.
 * Exit 0 when required tables/indexes exist.
 */
import pg from 'pg';

const REQUIRED_TABLES = [
  'orders',
  'order_items',
  'products',
  'product_images',
  'profiles',
  'customers',
  'payment_events',
  'sms_messages',
  'schema_migrations',
];

const REQUIRED_INDEXES = [
  'idx_order_items_product_id',
  'idx_product_images_product_id',
  'idx_orders_payment_status_created',
];

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const missingTables = [];
for (const t of REQUIRED_TABLES) {
  const { rows } = await client.query(`SELECT to_regclass($1) AS ok`, [`public.${t}`]);
  if (!rows[0].ok) missingTables.push(t);
}

const { rows: idxRows } = await client.query(
  `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname = ANY($1::text[])`,
  [REQUIRED_INDEXES]
);
const have = new Set(idxRows.map((r) => r.indexname));
const missingIndexes = REQUIRED_INDEXES.filter((i) => !have.has(i));

const { rows: mig } = await client.query(
  `SELECT count(*)::int AS n FROM schema_migrations`
);

console.log(
  JSON.stringify(
    {
      ok: missingTables.length === 0 && missingIndexes.length === 0,
      migrations_tracked: mig[0]?.n ?? 0,
      missingTables,
      missingIndexes,
    },
    null,
    2
  )
);

await client.end();
process.exit(missingTables.length || missingIndexes.length ? 1 : 0);
