# Repair Changelog — 2026-07-30

## Phase A — Shape A Postgres foundation (prior + continued)

- Added `lib/db/*`, `/rest|/auth|/storage` shims, dual-mode `supabaseAdmin`, plain-PG middleware  
- Provisioned `store_veecare`, applied schema + auth/storage bootstrap  
- Docs: `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`  

## Phase B — Audit repairs (this pass)

### Files / modules

- Retargeted SSR/API to `supabaseAdmin`: home/blog/store-modules, sitemap, storefront APIs, cron, chat, product page  
- Split `lib/affiliate-client.ts` vs `lib/affiliate.ts` (server RPC)  
- `import 'server-only'` in `lib/supabase-admin.ts`  
- Moolre callback: `lib/payments/moolre-verify.ts` status API before paid  
- SMS idempotency: `customer_sms_sent_at` + SMS fetch timeout  
- `next.config.ts` images unoptimized + sslip patterns  
- `public/service-worker.js` same-origin storage cache  
- REST ACL: `support_messages` public insert  
- Migration: `20260730120000_payment_events_and_sms_messages.sql` (applied on VPS)  
- Deps: `jose`, `bcryptjs`, `server-only`, `@types/pg`, `@types/bcryptjs`  

### Packages

- Added: `jose`, `bcryptjs`, `server-only`, type packages  
- Kept: `@supabase/supabase-js` (Shape A intentional)  

### Build

- `npm run build` — **passes** (eslint warnings only on hooks deps)  

### Manual actions still required

1. Create Coolify `veecare-staging`, push branch, set env cutover trio  
2. Restore live Supabase dump into `store_veecare`  
3. Register payment callback URLs  
4. Create admin user (`npm run create-admin` adapted for plain PG or signup + role update)  
5. Hubtel: not in scope — not implemented  
