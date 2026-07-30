#!/usr/bin/env bash
set -euo pipefail
source /data/fleet/secrets/db-stack.env
docker exec -e PGPASSWORD="$POSTGRES_SUPERPASS" -i fleet-postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d store_veecare \
  < /tmp/veecare-migrate/20260730120000_payment_events_and_sms_messages.sql
echo DONE
