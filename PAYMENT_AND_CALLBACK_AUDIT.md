# Payment & Callback Audit — Vee Care

## Gateways

| Gateway | In codebase | Initiation | Callback | Verify | Amount trust | Duplicate paid |
|---------|-------------|------------|----------|--------|--------------|----------------|
| **Moolre** | Yes | `/api/payment/moolre` | `/api/payment/moolre/callback` | `/api/payment/moolre/verify` | DB `orders.total` | `mark_order_paid` + already-paid short-circuit |
| **Paystack** | Yes | `/api/payment/paystack` | HMAC callback | verify API | DB total vs Paystack | Same RPC pattern |
| **Hubtel** | **No** | — | — | — | — | Not implemented |

## Moolre flow (hardened 2026-07-30)

1. Checkout creates order with server-side totals.  
2. Init sends unique `externalref` (often `ORD-…-R{ts}`).  
3. Callback: parse body → amount check → **`verifyMoolreExternalRef` status API** → `mark_order_paid`.  
4. Order-success page also calls `/verify` (independent confirmation).  
5. Middleware **skips** `/api/payment/*/callback`.  

## Paystack flow

1. Init with secret key server-side.  
2. Callback verifies `x-paystack-signature` HMAC + provider verify.  
3. Amount compared to DB total before paid.  

## Idempotency

- Already-paid callbacks retry notifications only (email/SMS flags).  
- `payment_events` table added for future event dedupe (unique gateway+external_event_id).  
- SMS confirmation: `metadata.customer_sms_sent_at`.  

## Test status

| Test | Status |
|------|--------|
| Production build includes payment routes | Pass |
| Live sandbox payment | **Blocked** — Coolify staging + credentials |
| Duplicate callback | Logic present; needs staging replay |
| Invalid signature (Paystack) | Code path present |
| Hubtel | N/A |

## Callback URLs to register (after Coolify)

- `https://<staging-host>/api/payment/moolre/callback`  
- `https://<staging-host>/api/payment/paystack/callback`  
