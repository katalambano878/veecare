#!/usr/bin/env bash
set -euo pipefail
source /data/fleet/secrets/db-stack.env
export PGPASSWORD="$POSTGRES_SUPERPASS"

docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" fleet-postgres \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='store_veecare' AND pid <> pg_backend_pid();"

docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" fleet-postgres \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS store_veecare;"

docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" fleet-postgres \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE store_veecare OWNER store_veecare;"

docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" fleet-postgres \
  psql -U postgres -d store_veecare -v ON_ERROR_STOP=1 -c \
  "REVOKE ALL ON SCHEMA public FROM PUBLIC; GRANT ALL ON SCHEMA public TO store_veecare;"

echo "store_veecare recreated"
