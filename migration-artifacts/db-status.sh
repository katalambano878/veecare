#!/usr/bin/env bash
set -euo pipefail
source /data/fleet/secrets/db-stack.env
export PGPASSWORD="$POSTGRES_SUPERPASS"
psql() { docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" -i fleet-postgres psql -U postgres -d store_veecare "$@"; }

echo "=== tables ==="
psql -c "SELECT count(*) AS public_tables FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"
psql -c "SELECT to_regclass('auth.users') AS auth_users, to_regclass('storage.buckets') AS storage_buckets, to_regclass('public.payment_events') AS payment_events, to_regclass('public.sms_messages') AS sms_messages;"

echo "=== critical rpcs ==="
psql -c "SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN ('mark_order_paid','upsert_customer_from_order','resolve_affiliate_code','apply_store_wide_discount','credit_affiliate_commission','can_insert_order_item') ORDER BY 1;"

echo "=== row counts ==="
psql -c "SELECT (SELECT count(*) FROM auth.users) AS auth_users, (SELECT count(*) FROM profiles) AS profiles, (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM categories) AS categories, (SELECT count(*) FROM orders) AS orders, (SELECT count(*) FROM customers) AS customers;"

echo "=== storage buckets ==="
psql -c "SELECT id, public FROM storage.buckets ORDER BY id;"

echo "=== store_veecare role connect ==="
psql -c "SELECT has_database_privilege('store_veecare', 'store_veecare', 'CONNECT') AS can_connect;"
echo DONE
