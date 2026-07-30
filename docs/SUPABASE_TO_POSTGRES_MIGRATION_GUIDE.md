# Vee Care — Supabase → Plain Postgres Cutover Guide

**Shape:** A — shimmed `@supabase/supabase-js` → plain PG  
**Repo:** `katalambano878/veecare`  
**Branch:** `staging/plain-postgres`  
**DB:** `fleet-postgres` / `store_veecare` (secrets: `/data/fleet/secrets/store_veecare.env`)  
**Coolify:** create `veecare-staging` when ready (not yet on VPS)

---

## Architecture

Browser `@supabase/supabase-js` points at the **app origin**. Requests hit in-app PostgREST/GoTrue/Storage shims backed by `pg` + local disk.

| Layer | Implementation |
|-------|----------------|
| Mode gate | `lib/db/mode.ts` — `DATABASE_URL` / `POSTGRES_URL` |
| REST | `app/rest/v1/*` + `lib/db/supabase-compat.ts` + `lib/db/rest-acl.ts` |
| Auth | `app/auth/v1/*` + `lib/db/auth.ts` (bcrypt + jose JWT) |
| Storage | `app/storage/v1/*` + `lib/db/storage.ts` (`STORAGE_ROOT`) |
| Server admin | `lib/supabase-admin.ts` → `createPgClient()` when plain PG |

---

## Env cutover trio

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | PgBouncer URL for `store_veecare` (from fleet provision) |
| `NEXT_PUBLIC_USE_PLAIN_PG` | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging/app origin (sslip or custom domain) |

Also set: `AUTH_JWT_SECRET`, `STORAGE_ROOT`, `STORAGE_PUBLIC_URL`, `STORAGE_SIGNING_SECRET`, anon/service key placeholders. See `.env.example`.

---

## Schema apply order

1. `migration-artifacts/01_auth_bootstrap.sql` — `auth.users`, `auth.uid()`, stub roles  
2. `migration-artifacts/02_storage_stub.sql` — minimal `storage.buckets` / `objects`  
3. `supabase/migrations/*.sql` in filename order  
4. (Later) import live dump + rewrite storage URLs  

---

## Inventory (veecare-specific)

- **Auth:** password login/signup; admin via `profiles.role` in `admin` \| `staff`; cookies `sb-access-token`  
- **Storage buckets:** `products`, `avatars`, `blog`, `media`, `reviews` (disk at cutover)  
- **Key RPCs:** `mark_order_paid`, `upsert_customer_from_order`, `resolve_affiliate_code`, `credit_affiliate_commission`, `apply_store_wide_discount`, `clear_store_wide_discount`, chat helpers  
- **Payments:** Moolre + Paystack (callbacks bypass middleware)  
- **Email/SMS:** Resend + Moolre SMS  

---

## Verification

```bash
# After Coolify staging exists:
curl -s https://veecare-staging.EXAMPLE/api/health
# expect mode plain_postgres / database ok

# Local / API smoke
# - Admin login sets JWT cookie
# - GET /rest/v1/products
# - Checkout + payment callback
# - Admin product image upload → file under STORAGE_ROOT
```

---

## Status (2026-07-30)

### Done
- Branch `staging/plain-postgres`
- Shape A shim ported (`lib/db/*`, rest/auth/storage routes, dual-mode admin, middleware)
- `store_veecare` provisioned; schema applied (37 public tables)
- Auth/storage bootstrap + `/data/veecare/storage` on VPS
- Project guide + `.env.example` cutover vars

### Waiting
1. Coolify `veecare-staging` app (owner/UI) on branch `staging/plain-postgres`
2. Live Supabase dump / `.env` for data restore
3. Push branch + set Coolify env cutover trio (`DATABASE_URL` from `/data/fleet/secrets/store_veecare.env`)
