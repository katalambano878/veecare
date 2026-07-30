#!/usr/bin/env bash
set -euo pipefail
source /data/fleet/secrets/db-stack.env
source /data/fleet/secrets/store_veecare.env
cp /tmp/veecare-migrate/restore_to_pg.js /tmp/veecare-migrate/work/
docker run --rm \
  --network coolify \
  -v /tmp/veecare-migrate/work:/work \
  -w /work \
  -e DATABASE_URL="postgres://postgres:${POSTGRES_SUPERPASS}@fleet-postgres:5432/store_veecare" \
  -e RESTORE_TEMP_PASSWORD="${RESTORE_TEMP_PASSWORD:-ChangeMeNow!123}" \
  -e NEW_STORAGE_PREFIX="/storage/v1/object/public" \
  node:20-bookworm \
  bash -lc 'npm install pg@8 bcryptjs@2 --no-save >/tmp/npm.log 2>&1 && node restore_to_pg.js'
echo DONE
