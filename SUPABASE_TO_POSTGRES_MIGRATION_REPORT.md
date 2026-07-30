# Supabase → Plain Postgres — Migration Report (Vee Care)

**Branch:** `staging/plain-postgres`  
**DB:** `store_veecare` on fleet-postgres  
**Shape:** A — keep `@supabase/supabase-js`, shim PostgREST/GoTrue/Storage

## Feature matrix

| Supabase feature | Replacement | Status |
|------------------|-------------|---------|
| Hosted Postgres | `DATABASE_URL` → `store_veecare` | Done (schema applied) |
| Auth (password) | `lib/db/auth.ts` + `/auth/v1` | Done |
| RLS | `lib/db/rest-acl.ts` + API auth | Done (tuned) |
| Storage | `STORAGE_ROOT` + `/storage/v1` | Done (disk) |
| RPC | Same SQL functions in migrations | Done |
| Realtime | Not used | N/A |
| Edge functions | N/A | N/A |
| Browser SDK | Point URL at app origin | Env cutover required |
| Service role | `supabaseAdmin` → `createPgClient` | Done |
| SSR helpers | Retargeted to `supabaseAdmin` | Done |

## Remaining `@supabase` usage (intentional)

- `lib/supabase.ts` — browser SDK  
- `lib/supabase-admin.ts` — dual-mode wrapper (`server-only`)  
- `middleware.ts` — hosted Supabase fallback when not plain PG  
- Scripts under `scripts/` — ops/legacy  

## Schema notes

- Auth bootstrap: `migration-artifacts/01_auth_bootstrap.sql`  
- Storage stub: `migration-artifacts/02_storage_stub.sql`  
- Commerce: `supabase/migrations/*`  
- Added: `20260730120000_payment_events_and_sms_messages.sql`  

## Env cutover trio

1. `DATABASE_URL` (from `/data/fleet/secrets/store_veecare.env`)  
2. `NEXT_PUBLIC_USE_PLAIN_PG=true`  
3. `NEXT_PUBLIC_SUPABASE_URL=<staging app origin>`  

Plus `AUTH_JWT_SECRET`, `STORAGE_*`, payment/SMS keys. See `.env.example`.
