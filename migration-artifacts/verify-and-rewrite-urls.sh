#!/usr/bin/env bash
set -euo pipefail
source /data/fleet/secrets/db-stack.env
export PGPASSWORD="$POSTGRES_SUPERPASS"

psql() {
  docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" -i fleet-postgres \
    psql -U postgres -d store_veecare "$@"
}

echo "=== counts ==="
psql -c "SELECT (SELECT count(*) FROM products) products, (SELECT count(*) FROM product_images) images, (SELECT count(*) FROM orders) orders, (SELECT count(*) FROM auth.users) users;"

echo "=== sample image urls ==="
psql -c "SELECT left(url,120) FROM product_images LIMIT 5;"

echo "=== rewrite any leftover supabase storage urls ==="
psql -c "
UPDATE product_images
SET url = replace(url, 'https://kczglollrtoyhidvgxoj.supabase.co/storage/v1/object/public', '/storage/v1/object/public')
WHERE url LIKE '%supabase.co/storage%';
UPDATE categories
SET image_url = replace(image_url, 'https://kczglollrtoyhidvgxoj.supabase.co/storage/v1/object/public', '/storage/v1/object/public')
WHERE image_url LIKE '%supabase.co/storage%';
UPDATE products
SET metadata = replace(metadata::text, 'https://kczglollrtoyhidvgxoj.supabase.co/storage/v1/object/public', '/storage/v1/object/public')::jsonb
WHERE metadata::text LIKE '%supabase.co/storage%';
"

echo "=== after rewrite ==="
psql -c "SELECT count(*) AS still_supabase FROM product_images WHERE url LIKE '%supabase.co%';"
psql -c "SELECT left(url,120) FROM product_images LIMIT 3;"
echo DONE
