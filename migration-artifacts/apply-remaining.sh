#!/usr/bin/env bash
set -euo pipefail
source /data/fleet/secrets/db-stack.env
DB=store_veecare
DIR=/tmp/veecare-migrate

run_sql() {
  local file="$1"
  echo "==> $(basename "$file")"
  docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" -i fleet-postgres \
    psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" < "$file"
}

# Re-run chat migration (partial) and remaining files
run_sql "$DIR/20260528180000_ai_chat_memory_and_kb.sql"

for f in \
  20260607180000_affiliate_system.sql \
  20260608113000_harden_sensitive_rpcs.sql \
  20260608120000_remove_public_guest_order_select.sql \
  20260608131000_fix_order_items_insert_after_rls_lockdown.sql \
  20260610120000_store_sale_and_coupon_redeem.sql
do
  run_sql "$DIR/$f"
done

echo "==> grants to store_veecare"
docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" -i fleet-postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" <<'SQL'
GRANT USAGE ON SCHEMA auth, storage, extensions, public TO store_veecare;
GRANT ALL ON ALL TABLES IN SCHEMA auth, storage, public TO store_veecare;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth, storage, public TO store_veecare;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth, public TO store_veecare;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO store_veecare;
SQL

docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" -i fleet-postgres \
  psql -U postgres -d "$DB" -c \
  "SELECT count(*) AS public_tables FROM information_schema.tables WHERE table_schema='public';"
echo DONE
