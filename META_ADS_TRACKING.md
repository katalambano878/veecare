# Meta Ads conversion tracking — Vee Care

Production-grade Facebook/Instagram conversion tracking for `veecare.shop`. Pixel + Conversions API, deduplicated, purchase only after the payment provider confirms the order.

## 1. Architecture overview

```
Ad click (fbclid + UTMs)
  → https://veecare.shop/product/{slug}
  → Pixel PageView + ViewContent (+ CAPI ViewContent)
  → Add to cart → Pixel + CAPI AddToCart
  → /checkout → Pixel + CAPI InitiateCheckout
  → Moolre / Paystack
  → mark_order_paid (server)
  → CAPI Purchase (authoritative order totals)
  → /order-success (only if payment_status=paid) → Pixel Purchase
  → Meta dedupes on event_name + event_id
```

Business logic never imports `fbq` directly. Storefront code calls `lib/analytics/events.ts`. Meta is one consumer of that layer.

## 2. Pixel configuration

- Loaded once on **public storefront** pages (`app/(store)/StoreLayoutClient.tsx`).
- Not loaded on `/admin`.
- Script: `https://connect.facebook.net/en_US/fbevents.js`
- Initial `PageView` is in the init snippet.
- App Router navigations send an additional `PageView` (the first client navigation after init is skipped so it is not double-counted).
- Pixel ID: `NEXT_PUBLIC_META_PIXEL_ID` (VEE CARE = `1305692745960591`)

## 3. Conversions API configuration

- Official endpoint: `POST https://graph.facebook.com/{version}/{datasetId}/events`
- Default Graph version: `v21.0` (override with `META_GRAPH_API_VERSION`)
- Dataset ID: `META_DATASET_ID` or the Pixel ID
- Access token is **server-only** (`META_ACCESS_TOKEN`). Never prefixed with `NEXT_PUBLIC_`.
- Timeout: 4 seconds. Failures are logged and ignored.
- Purchase is **never** accepted from `/api/analytics/meta`.

## 4. Required environment variables

| Variable | Where | Required |
|---|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | Browser | Yes, for Pixel |
| `META_ACCESS_TOKEN` | Server | Yes, for CAPI |
| `META_PIXEL_ID` | Server | Optional (defaults to public Pixel ID) |
| `META_DATASET_ID` | Server | Optional (defaults to Pixel ID) |
| `META_TEST_EVENT_CODE` | Server | Test Events Manager only |
| `META_ALLOW_TEST_EVENTS` | Server | Must be `true` to send test codes in `NODE_ENV=production` |
| `META_GRAPH_API_VERSION` | Server | Optional, default `v21.0` |

If Pixel ID or access token is missing, tracking is skipped. The storefront does not crash.

Coolify: add these on `veecare-app`. Redeploy or restart after saving.

## 5. Events implemented

| Event | Pixel | CAPI | When |
|---|---|---|---|
| PageView | Yes | No | Storefront load + client navigations |
| ViewContent | Yes | Yes | Product page data loaded |
| AddToCart | Yes | Yes | After `CartContext.addToCart` succeeds |
| InitiateCheckout | Yes | Yes | Checkout page with a non-empty cart (once) |
| Purchase | Yes | Yes | After `payment_status === 'paid'` |

Buy Now adds to cart then goes to `/checkout`. Sequence is ViewContent → AddToCart → InitiateCheckout → Purchase. No extra synthetic events.

## 6. Event payloads

Shared fields:

- `content_ids` — product UUID (same ID across the funnel; catalog-ready)
- `content_type` — `product`
- `contents[]` — `{ id, quantity, item_price }`
- `value` — number
- `currency` — `GHS` (ISO). Never `GH₵` / `GHC`

Purchase also includes `order_id` (order number, e.g. `ORD-…`) and `event_id` = `purchase_{order.uuid}`.

Purchase **value** is `orders.total` from Postgres, not a browser-submitted amount.

## 7. Deduplication strategy

| Event | `event_id` |
|---|---|
| ViewContent / AddToCart / InitiateCheckout | Random `view_` / `cart_` / `checkout_` UUID, same ID on Pixel + CAPI |
| Purchase | Stable `purchase_{orders.id}` on both channels |

Pixel: `fbq('track', name, payload, { eventID })`  
CAPI: `event_id` field

Meta counts one conversion when `event_name` + `event_id` match within 48 hours.

## 8. Purchase verification strategy

Purchase does **not** fire because the customer landed on `/order-success?payment_success=true`.

Authoritative path (unchanged payment logic):

1. Gateway callback or `/api/payment/*/verify`
2. Provider API / signature verification
3. Amount match against `orders.total`
4. `mark_order_paid` RPC
5. Then `scheduleMetaPurchaseForPaidOrder` (async, non-blocking)

Pixel Purchase on the thank-you page runs only after `/api/orders/status` (or verify) reports `payment_status: 'paid'`.

## 9. Payment gateway integration

| Gateway | Confirm | Purchase hook |
|---|---|---|
| Moolre | Callback secret + amount + status API; verify route uses Moolre status API | `app/api/payment/moolre/{callback,verify}` |
| Paystack | HMAC signature + verify API | `app/api/payment/paystack/{callback,verify}` |

POS `mark_order_paid` is not wired to Meta (in-store, not an ad conversion).

Analytics failure never rolls back payment, stock, loyalty, or email.

## 10. UTM attribution

`components/AttributionCapture.tsx` persists (30 days, localStorage + sessionStorage):

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `fbclid` → `fbc` as `fb.1.{timestamp_ms}.{fbclid}` (only if a real `fbclid` exists)
- `_fbp` cookie when present
- first-touch `landing_page` and external `referrer`

Checkout writes these onto `orders.metadata` plus `marketing_consent`. No new required columns (old orders stay valid).

Admin order detail shows Source / Campaign / Landing page / Facebook click when present.

## 11. Testing instructions

1. Set Pixel ID + CAPI token (and optional `META_TEST_EVENT_CODE` in staging).
2. Open a product: `https://veecare.shop/product/{slug}?utm_source=facebook&utm_medium=paid_social&utm_campaign=TEST&fbclid=TESTCLICK`
3. Confirm the page loads the correct product (no login).
4. Add to cart → checkout → pay with a real/test gateway charge.
5. Confirm the order is `paid` in admin before expecting Purchase.

## 12. Meta Events Manager testing

- Browser: Pixel Helper / Events Manager Test Events (browser tab).
- Server: Test Events with `META_TEST_EVENT_CODE` **only** when `NODE_ENV !== production` **or** `META_ALLOW_TEST_EVENTS=true`.
- Purchase should appear once (Pixel + CAPI deduped), value = order total, currency `GHS`.
- Match quality improves with email/phone (hashed server-side) + `fbp`/`fbc`.

## 13. Deployment checklist

- [ ] Add env vars in Coolify (`veecare-app`). Do not commit tokens.
- [ ] Deploy / restart the app.
- [ ] Confirm `https://veecare.shop/product/{any-active-slug}` returns 200 with OG tags.
- [ ] Events Manager: Pixel active on storefront, not duplicated in GTM (this site has **no GTM container**; only optional GA4 `gtag`).
- [ ] Place a small paid test order and confirm one Purchase.
- [ ] Remove `META_TEST_EVENT_CODE` / `META_ALLOW_TEST_EVENTS` from production after QA.

## 14. Troubleshooting

| Symptom | Check |
|---|---|
| No Pixel | `NEXT_PUBLIC_META_PIXEL_ID` unset, or `cookieConsent.marketing === false` |
| No CAPI | `META_ACCESS_TOKEN` unset; look for `[META_EVENT_FAILED]` (no token in logs) |
| Double Purchase | Another tool sending Purchase (none in this repo). Confirm only this Pixel ID. |
| Missing Purchase | Order not `paid`; gateway verify failed; `marketing_consent` stored false |
| Duplicate Purchase retries | Expected CAPI retry uses same `event_id`; `[META_PURCHASE_ALREADY_SENT]` after first success |
| Wrong currency | Must be `GHS`. Display `GH₵` is UI only. |

## 15. Security notes

- Access token is server-only.
- `/api/analytics/meta` rejects `Purchase` and does not accept amounts as payment proof.
- Purchase value/contents come from `orders` / `order_items`.
- Customer email/phone/name are SHA-256 hashed for CAPI. `fbp`, `fbc`, IP, UA are not hashed.
- Webhook IPs are **not** sent as `client_ip_address` (only browser verify IP).
- Logs never include tokens, card data, or raw PII.

## 16. Meta Catalog readiness

No product feed exists today (no Google Merchant / Facebook XML). Tracking already uses product UUIDs consistently.

Later catalog feed (recommended):

- URL: `/api/feeds/meta-catalog` (CSV or XML)
- `id` = `products.id` (same as `content_ids`)
- `title`, `description`, `availability`, `condition`, `price` (`{amount} GHS`), `link` = `{APP_URL}/product/{slug}`, `image_link`, `brand`

Sitemap already lists `https://veecare.shop/product/{slug}`.

## 17. Files changed

**New**

- `lib/analytics/types.ts`, `consent.ts`, `event-id.ts`, `attribution.ts`, `meta-pixel.ts`, `events.ts`
- `lib/meta/config.ts`, `hash.ts`, `user-data.ts`, `conversions-api.ts`, `purchase.ts`
- `components/MetaPixel.tsx`, `components/AttributionCapture.tsx`
- `app/api/analytics/meta/route.ts`
- `META_ADS_TRACKING.md`

**Updated**

- `app/(store)/StoreLayoutClient.tsx`
- `app/(store)/product/[slug]/ProductDetailClient.tsx`
- `app/(store)/checkout/page.tsx`
- `app/(store)/order-success/page.tsx`
- `context/CartContext.tsx`
- `app/api/payment/moolre/{callback,verify}/route.ts`
- `app/api/payment/paystack/{callback,verify}/route.ts`
- `app/api/orders/status/route.ts`
- `app/admin/orders/[id]/OrderDetailClient.tsx`
- `components/CookieConsent.tsx` (dispatches consent updates; banner still unused)
- `lib/rate-limit.ts`
- `.env.example`

## 18. Cookie consent

`components/CookieConsent.tsx` exists but is **not mounted**. If `localStorage.cookieConsent` is missing, Meta is allowed (same as current GA4). If `marketing` is explicitly `false`, Pixel and CAPI browser events are suppressed; Purchase CAPI is also skipped when checkout stored `marketing_consent: false`.

Do not add a second consent banner.

## 19. Product URLs for ads

Use the existing public route (no `/products/` prefix):

```
https://veecare.shop/product/{product-slug}
```

Example with campaign params:

```
https://veecare.shop/product/{slug}?utm_source=facebook&utm_medium=paid_social&utm_campaign={campaign}&utm_content={creative}&fbclid={{site_source_name}}
```

Meta appends `fbclid` automatically when the ad is served. Slugs are stable, in the sitemap, and work as cold links (server `generateMetadata` + client fetch by slug).

## 20. What an external Meta Ads / MCP layer needs

Do not put Marketing API or MCP credentials in this app.

Share separately:

- Pixel / Dataset ID
- Domain: `veecare.shop`
- Currency: `GHS`
- Content IDs: product UUIDs
- Events: ViewContent, AddToCart, InitiateCheckout, Purchase
- Product URL pattern: `/product/{slug}`
- Catalog: not created yet
