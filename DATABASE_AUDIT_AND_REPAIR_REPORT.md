# DATABASE AUDIT AND REPAIR REPORT — Vee Care

**Audit date:** 2026-08-02  
**Auditor role:** Principal PostgreSQL / Next.js / payments audit (this session)  
**Git branch:** `staging/plain-postgres`  
**Connected database:** `store_veecare` on `fleet-postgres` (serves **production** `https://veecare.shop` — not a separate staging DB)

---

## 1. Baseline (before repair)

| Check | Result |
|-------|--------|
| App mode | `plain_postgres` (Shape A) |
| PG | PostgreSQL 16.x (fleet-postgres) |
| Public tables | 39 |
| Auth users / profiles | 5 / 5 (aligned) |
| Orders | 81 (43 paid, 38 pending) |
| Products / images | 42 / 48 (no orphans, no PNG URLs) |
| Migration history table | **Missing** |
| `payment_events` / `sms_messages` | Present, **0 rows**, unused by runtime |
| FK indexes missing | 24 heuristic gaps (hot paths) |
| Paid notify gaps (historical) | cust_email 31/43, admin 26/43, sms 1/43 |
| Hubtel | **Not implemented** in this repo |

Backup taken before corrective migration:  
`/data/fleet/backups/veecare/store_veecare_pre_audit_20260802_082632.dump`

---

## 2. Architecture found

- **Library:** `pg` pool + `@supabase/supabase-js` pointed at app origin  
- **Shims:** `/rest/v1`, `/auth/v1`, `/storage/v1`  
- **Compat:** `lib/db/supabase-compat.ts`, `fk-map.ts`, `rest-acl.ts`, `auth.ts`, `storage.ts`  
- **Migrations:** `supabase/migrations/*.sql` (+ bootstrap under `migration-artifacts/`)  
- **ORM:** none (no Prisma/Drizzle)

---

## 3. Schema audit results

| Class | Count / notes |
|-------|----------------|
| Total public tables | 39 + `schema_migrations` |
| Healthy | Core catalog, orders, auth alignment |
| Repaired | Indexes, CHECKs, migration tracking, event wiring |
| Missing created | `schema_migrations` |
| Obsolete | none deleted |
| Manual review | 38 pending Moolre attempts (mostly unpaid “Transaction not found”) |

---

## 4. Column / type notes

- Money columns use `numeric` (parsed to JS number via pool type parser) — acceptable; not float4/8.  
- Timestamps are `timestamptz`.  
- Enums present for order/payment/product/user roles.  
- No UUID-as-text drift found on PK columns.

---

## 5. Relationship / constraint repairs

- Added CHECK: `orders_total_non_negative`, `order_items_quantity_positive`  
- Confirmed FKs exist from complete schema; added **indexes** on unindexed FK columns used in embeds/admin  
- Orphan order_items / product_images: **0**  
- Profile ↔ auth.users: **0** orphans  

---

## 6. Migration results

| Version | Name | Status |
|---------|------|--------|
| …prior 10 files… | (see MIGRATION_STATUS_REPORT) | Recorded in `schema_migrations` |
| `20260802120000` | db_audit_indexes_and_tracking | **Applied** 2026-08-02 |

---

## 7. Supabase → Postgres

Shape A retained intentionally. Runtime uses 3 direct `@supabase/supabase-js` imports (`lib/supabase.ts`, `lib/supabase-admin.ts`, `middleware.ts`). Hosted Supabase is not the data plane when `DATABASE_URL` + `NEXT_PUBLIC_USE_PLAIN_PG` are set. RLS policies remain in DB; app role `store_veecare` has `BYPASSRLS`; HTTP ACL in `rest-acl.ts` enforces ownership for browser REST.

---

## 8. Payment / SMS

- Moolre callback + verify now write `payment_events`.  
- SMS sends write `sms_messages` (masked recipient).  
- Status API JSON-vs-`text/html` Content-Type bug was previously fixed (session prior to this audit).  
- Paystack routes exist; Hubtel absent.  

---

## 9. Performance

- Pool: `max` via `PG_POOL_MAX` (default 10), `connectionTimeoutMillis=10000`, `statement_timeout=30s` per connection.  
- New indexes: order_items.product_id, product_images.product_id, orders(payment_status, created_at), etc.  
- Storage images previously compressed + SW cache-first (prior work).

---

## 10. Security

- `payment_events` / `sms_messages` / `schema_migrations` denied to non-staff REST.  
- Callbacks still require amount check + status API (or matching callback secret fallback).  
- No credentials logged in this report.  
- Health endpoint exposes only safe status flags.

---

## 11. Remaining risks (manual)

1. Historical paid orders missing SMS/email flags — do **not** mass-resend without business approval.  
2. Separate Coolify **staging** app/DB still not provisioned; branch name ≠ isolated DB.  
3. `payment_events` uniqueness is on `(gateway, external_event_id)` — ensure every insert uses a distinct event id for result rows (implemented with suffixes).  
4. Numeric JS float conversion for money remains a precision caveat for very large values (GHS retail OK).

---

## 12. Final readiness

**Ready after listed manual actions** — schema/indexes/event wiring applied; deploy app code for event recording + health schema check; confirm `/api/health` shows `schema=ok` after deploy.
