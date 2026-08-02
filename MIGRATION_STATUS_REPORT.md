# Migration Status Report — Vee Care

## Tooling

| Item | Value |
|------|--------|
| Source of truth | `supabase/migrations/*.sql` |
| Bootstrap | `migration-artifacts/01_auth_bootstrap.sql`, `02_storage_stub.sql` |
| Apply (local) | `npm run db:migrate` / `scripts/apply-migrations-pg.mjs` |
| Tracking table | `public.schema_migrations` (added 2026-08-02) |
| Prior tracking | **None** (Supabase `schema_migrations` was not present post-cutover) |

## Applied versions (live `store_veecare`)

| Version | Name |
|---------|------|
| 20260209000000 | complete_schema |
| 20260218000000 | allow_null_order_items_product_fks |
| 20260219000000 | contact_submissions |
| 20260528180000 | ai_chat_memory_and_kb |
| 20260607180000 | affiliate_system |
| 20260608113000 | harden_sensitive_rpcs |
| 20260608120000 | remove_public_guest_order_select |
| 20260608131000 | fix_order_items_insert_after_rls_lockdown |
| 20260610120000 | store_sale_and_coupon_redeem |
| 20260730120000 | payment_events_and_sms_messages |
| 20260802120000 | db_audit_indexes_and_tracking |

## Corrective migration details (`20260802120000`)

**Destructive?** No table drops. Adds indexes + optional CHECKs + tracking rows.  
**Backup:** `/data/fleet/backups/veecare/store_veecare_pre_audit_20260802_082632.dump`  
**Rollback:** Drop listed indexes; `DELETE FROM schema_migrations WHERE version='20260802120000'`; CHECKs via `ALTER TABLE … DROP CONSTRAINT`.

## Pending

None for schema files currently in repo after apply.

## Deployment order

1. Apply SQL on `store_veecare` (done for audit migration).  
2. Deploy app (`veecare-app`) so payment/SMS event writers + health schema check go live.  
3. `GET /api/health` → `checks.schema=ok`.
