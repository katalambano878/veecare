# Vee Care — Full System Audit

**Date:** 2026-07-30  
**Branch:** `staging/plain-postgres`  
**Mode:** Shape A (shimmed `@supabase/supabase-js` → plain Postgres)

---

## Baseline (before this repair pass)

| Check | Result |
|-------|--------|
| Git | Dirty working tree with Shape A shim in progress |
| Coolify staging | **Not created** (no `veecare-*` app on VPS) |
| DB | `store_veecare` provisioned; schema applied (37+ tables) |
| Production build | **Failed** — `pg`/`fs` pulled into client via `checkout → affiliate → supabaseAdmin` |
| Hubtel | Not present in codebase |
| Live E2E against staging URL | Blocked (no Coolify app yet) |

---

## Architecture summary

```
Browser supabase-js → NEXT_PUBLIC_SUPABASE_URL (must be app origin)
  → /rest/v1, /auth/v1, /storage/v1 shims → pg Pool (DATABASE_URL)
Server APIs → supabaseAdmin → createPgClient() when DATABASE_URL set
Uploads → STORAGE_ROOT disk via storage shim
Payments → Moolre + Paystack (no Hubtel)
SMS → Moolre
```

---

## Route inventory (counts)

| Kind | Count |
|------|------:|
| Store pages | 35 |
| Admin pages | 23 |
| API routes | 27 |
| Shim routes | rest/auth/storage (6 handlers) |
| **Total page routes** | **58** |

### Payment / SMS / callback routes

| Route | Purpose | Auth | Status |
|-------|---------|------|--------|
| `POST /api/payment/moolre` | Initiate | Public | OK (DB amount) |
| `POST /api/payment/moolre/callback` | Webhook | Public + middleware bypass | **Hardened** (status API verify) |
| `POST /api/payment/moolre/verify` | Order-success verify | Public + rate limit | OK |
| `POST /api/payment/paystack` | Initiate | Public | OK |
| `POST /api/payment/paystack/callback` | Webhook HMAC | Public + bypass | OK |
| `POST /api/payment/paystack/verify` | Verify | Public | OK |
| `GET /api/payment/methods` | Availability | Public | OK |
| Moolre SMS via `lib/notifications.ts` | Order/status | Server-only | **Idempotent** SMS flag |
| Hubtel | — | — | **N/A — not implemented** |

---

## Page audit (summary)

| Group | Status |
|-------|--------|
| Public storefront (home, shop, product, cart, blog, contact, static) | Build OK; runtime needs cutover env + data |
| Auth (login/signup) | Uses browser SDK → requires app-origin URL in plain PG |
| Checkout / pay / order-success | Build OK; payments use supabaseAdmin |
| Account / wishlist / returns / support | Client SDK + ACL; needs staging smoke |
| Admin (all) | Middleware JWT path for plain PG; login via `/auth/v1` |
| Affiliate | Client helpers split from server RPC |

**Pages requiring manual staging smoke after Coolify:** checkout→pay→callback, admin login/upload, chat, cron reminders.

---

## Root causes (migration breakage)

1. Server paths still used raw `createClient(NEXT_PUBLIC_SUPABASE_URL)` → wrong DB after cutover  
2. Client/server boundary: `supabaseAdmin`/`pg` imported into client bundles  
3. Moolre callback trusted payload without independent provider verification  
4. SMS re-send on notification retry (no idempotency flag)  
5. Image/SW config locked to `*.supabase.co`  
6. Missing Coolify staging + env cutover trio  

---

## Security findings

| Finding | Severity | Fix |
|---------|----------|-----|
| Moolre callback forgery if secret omitted | High | Verify via Moolre status API before `mark_order_paid` |
| Client importing server DB client | High | `server-only` + `affiliate-client` split |
| RLS removed → rely on rest-acl | Medium | ACL tuned; staff/service bypass |
| Coupons public GET | Low | Pre-existing; documented |

---

## Performance

| Issue | Fix |
|-------|-----|
| Next/Image + Coolify sharp | `images.unoptimized: true` |
| Shared pg pool | `lib/db/pool.ts` |
| External SMS/payment hangs | 15s AbortController on SMS + Moolre status |
| SW image cache miss on local storage | Cache `/storage/v1/` same-origin |

---

## Remaining risks

- No Coolify staging deploy yet — full browser E2E not run against sslip  
- Live Supabase data not restored into `store_veecare`  
- Browser still needs `NEXT_PUBLIC_SUPABASE_URL=<app origin>`  
- Hubtel requested in audit prompt but **not in product**  
- Forgot-password UI still a stub  
