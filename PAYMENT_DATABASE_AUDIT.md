# Payment Database Audit — Vee Care

## Shared model (current)

Primary store of payment truth: **`orders`** row (`payment_status`, `payment_method`, `payment_provider`, `metadata` JSONB).  
RPC: `mark_order_paid(order_ref, moolre_ref)` — sets paid, transitions pending→processing, stock once, merges metadata.

Audit tables (2026-07-30 schema, wired 2026-08-02):

- `payment_events` — gateway callbacks/verifies  
- `sms_messages` — outbound SMS attempts (masked recipient)

There is **no** separate `payment_attempts` table yet; attempts are encoded as `metadata.moolre_externalref` / Paystack refs on the order.

---

## Moolre

| Concern | Status |
|---------|--------|
| Init creates pending + external ref | Yes (`/api/payment/moolre`) |
| Callback URL | `https://veecare.shop/api/payment/moolre/callback` |
| Amount check vs `orders.total` | Yes |
| Independent status API verify | Yes (`lib/payments/moolre-verify.ts`) — parses JSON even when CT=`text/html` |
| Secret on callback | Validated when present (`body.secret` or `data.secret`) |
| Idempotent already-paid | Yes + notification retry |
| Event audit rows | Yes (`recordPaymentEvent`) |
| Frontend redirect alone marks paid | **No** |

## Paystack

| Concern | Status |
|---------|--------|
| Routes | `/api/payment/paystack`, callback, verify |
| Tables | Same `orders` + now `payment_events` (wire Paystack similarly if enabling) |
| Config on prod | Optional (`PAYSTACK_SECRET_KEY` may be absent) |

## Hubtel

**Not present** in this codebase. No tables or routes to audit.

---

## Data snapshot (audit day)

| Metric | Value |
|--------|-------|
| Paid orders | 43 |
| Pending | 38 |
| Pending with moolre_externalref | 29 (mostly abandoned; Moolre “Transaction not found”) |
| Dup order_number | 0 |
| Paid without payment_verified_at | 0 |

## Recommendations

1. Optional future: first-class `payment_attempts` table (multi-attempt history).  
2. Wire Paystack callback through `recordPaymentEvent` when Paystack goes live.  
3. Do not bulk-mark pending historical orders paid without Moolre confirmation.
