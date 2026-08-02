# Supabase → Postgres Database Report — Vee Care

## Strategy: Shape A (intentional)

Keep `@supabase/supabase-js` API surface; replace hosted PostgREST/GoTrue/Storage with in-app shims over plain Postgres + disk.

| Supabase Feature | Previous | PostgreSQL Replacement | Status |
|------------------|----------|----------|------------------------|--------|
| Postgres tables | Hosted project | `store_veecare` on fleet-postgres | Done |
| PostgREST | `*.supabase.co/rest/v1` | `app/rest/v1` + `supabase-compat` | Done |
| Auth / GoTrue | Hosted Auth | `lib/db/auth.ts` + `app/auth/v1` + `auth.users` | Done |
| RLS | Policies on tables | Policies remain; role `BYPASSRLS` + `rest-acl.ts` for HTTP | Done (hybrid) |
| Storage | Supabase Storage | Disk `STORAGE_ROOT` + `/storage/v1` routes | Done |
| Realtime | Channels | Not used / not replaced | N/A |
| Edge functions | Deno | Next.js API routes | Done |
| RPC | `supabase.rpc` | SQL functions + `/rest/v1/rpc` | Done |
| Types | Generated supabase types | Hand-maintained TS + FK map | Partial |

## Remaining `@supabase` runtime imports (intentional)

1. `lib/supabase.ts`  
2. `lib/supabase-admin.ts` (switches to `createPgClient` when `DATABASE_URL` set)  
3. `middleware.ts` (jose path when plain PG)

## Env cutover

Required: `DATABASE_URL`, `NEXT_PUBLIC_USE_PLAIN_PG=true`, `NEXT_PUBLIC_SUPABASE_URL=<app origin>`, `AUTH_JWT_SECRET`, `STORAGE_ROOT`.

Legacy hosted keys may still exist for dual-mode; browser must not point at `*.supabase.co` in production.
