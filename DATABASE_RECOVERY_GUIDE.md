# Database Recovery Guide — Vee Care

## Environment confirmation

| Item | Value |
|------|--------|
| Database name | `store_veecare` |
| Host (Docker) | `fleet-postgres` (private Docker network) |
| App | Coolify `veecare-app` → `https://veecare.shop` |
| App role | `store_veecare` (`BYPASSRLS` enabled for server pool) |

**Important:** Despite the git branch name `staging/plain-postgres`, the Coolify app and DB currently serving `veecare.shop` are the **live production** store database. Treat every destructive change as production-impacting.

## Backup (schema + data)

```bash
ssh big-vps
# Logical dump (no credentials printed)
sudo docker exec fleet-postgres pg_dump -U postgres -d store_veecare \
  --format=custom --file=/tmp/store_veecare_$(date +%Y%m%d_%H%M).dump
sudo mkdir -p /data/fleet/backups/veecare
sudo docker cp fleet-postgres:/tmp/store_veecare_YYYYMMDD_HHMM.dump \
  /data/fleet/backups/veecare/
```

Schema-only:

```bash
sudo docker exec fleet-postgres pg_dump -U postgres -d store_veecare --schema-only \
  > /data/fleet/backups/veecare/schema_$(date +%Y%m%d).sql
```

## Restore

```bash
sudo docker exec -i fleet-postgres pg_restore -U postgres -d store_veecare --clean --if-exists \
  /tmp/store_veecare_YYYYMMDD_HHMM.dump
```

Prefer restore into a **new** database first, then cut over after verification.

## Migration rollback

1. Inspect `public.schema_migrations` for the last applied version.
2. Prefer a **forward-fix** migration over reversing applied SQL.
3. Index-only migrations (`20260802120000_*`) can be rolled back with:

```sql
DROP INDEX IF EXISTS idx_order_items_product_id;
-- …repeat for indexes added in that file
DELETE FROM schema_migrations WHERE version = '20260802120000';
```

## Payment / order recovery

- Paid state is owned by `mark_order_paid(order_ref, moolre_ref)`.
- Reconcile via `POST /api/payment/moolre/verify` with `{ "orderNumber": "ORD-…" }` after Moolre confirms.
- Audit trail: `payment_events`, `orders.metadata` (`moolre_reference`, `payment_verified_at`, notification flags).

## Post-restore checks

```bash
curl -sS https://veecare.shop/api/health
# expect status healthy|degraded, checks.database=ok, checks.schema=ok
```

```sql
SELECT payment_status, status, count(*) FROM orders GROUP BY 1,2;
SELECT count(*) FROM schema_migrations;
SELECT count(*) FROM payment_events;
```
