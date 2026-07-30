# Performance Report — Vee Care

## Baseline problems

1. **Build failure / freeze risk:** importing `pg` into client bundles via affiliate helpers → webpack failed; would also crash browsers.  
2. **Image pipeline:** Coolify non-root + remote Supabase patterns brittle.  
3. **External API hangs:** SMS/payment status without timeouts.  
4. **PWA:** service worker only cached `supabase.co` storage images.  

## Fixes applied

| Area | Change | Expected effect |
|------|--------|-----------------|
| Bundle boundary | `affiliate-client.ts` + `server-only` on admin | Client no longer pulls `pg` |
| Images | `images.unoptimized: true` + sslip remotePatterns | Stable product images on VPS |
| SMS | 15s AbortController | No hung SMS freezing callbacks |
| Moolre status | 15s AbortController in `moolre-verify.ts` | Callbacks fail fast |
| SW | Cache `/storage/v1/` same-origin | Offline/PWA image path |
| DB | Shared pool in `lib/db/pool.ts` | Avoid per-request clients |

## Measurements

| Metric | Before | After |
|--------|--------|-------|
| `next build` | Fail (`Can't resolve 'fs'`) | **Success** |
| Staging Lighthouse / TTFB | N/A (no deploy) | Pending Coolify |
| Slow SQL EXPLAIN | Not run (empty staging DB) | After data restore |

## Recommendations

1. Paginate admin order/customer lists if tables grow large.  
2. Add composite indexes after observing real filters (payment_status + created_at already partially indexed).  
3. Keep payment callbacks fast — notifications already try/catch; consider queue later.  
