#!/usr/bin/env bash
set -euo pipefail
source /data/fleet/secrets/db-stack.env
rm -f /tmp/veecare-migrate/.env.local
echo "=== storage ==="
find /data/veecare/storage -type f | wc -l
du -sh /data/veecare/storage
echo "=== db ==="
docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" -i fleet-postgres \
  psql -U postgres -d store_veecare -c \
  "SELECT
    (SELECT count(*) FROM auth.users) AS users,
    (SELECT count(*) FROM products) AS products,
    (SELECT count(*) FROM product_images) AS images,
    (SELECT count(*) FROM orders) AS orders,
    (SELECT count(*) FROM customers) AS customers,
    (SELECT count(*) FROM categories) AS categories,
    (SELECT count(*) FROM chat_conversations) AS chats,
    (SELECT count(*) FROM support_knowledge_base) AS kb;"
echo DONE
