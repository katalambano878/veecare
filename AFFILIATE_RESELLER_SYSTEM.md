# Vee-care Affiliate / Reseller System

Production financial model for https://veecare.shop. Affiliate earnings are **added on top of** Vee-care’s product base price. They are never subtracted from it.

## Architecture

- **Pricing:** `lib/reseller/pricing.ts` + integer pesewas in `lib/reseller/money.ts`
- **Checkout quote:** `lib/reseller/quote-order.ts` (server-only)
- **Attribution:** signed httpOnly cookie `veecare_aff_attr` via `lib/reseller/attribution.ts`
- **Portal auth:** email OTP + signed httpOnly cookie `veecare_aff_session`
- **Order create:** `POST /api/checkout/create-order` — browser amounts are ignored
- **Earnings:** `lib/reseller/earnings.ts` after gateway-verified `payment_status = paid`
- **Payments:** existing Moolre / Paystack routes charge `orders.total` from the database

## Financial model

```
affiliate_markup = base_price × markup_rate   (percentage)
                 = fixed_markup               (fixed)
                 = selling_price − base_price (custom, admin-gated)

affiliate_selling_price = base_price + affiliate_markup
```

Example: base GH₵250, 10% → customer GH₵275, Vee-care GH₵250, affiliate GH₵25.

Shipping and tax are not marked up. Current checkout shipping and tax are GH₵0.

### Discounts

Merchant-funded coupons and loyalty points reduce **affiliate markup first**. They cannot push Vee-care below the current product base. Excess discount is capped.

### Snapshots

Each affiliate order stores `orders.metadata.reseller` and item-level snapshots (`product_base_price`, `affiliate_markup_*`, `affiliate_selling_price`). Later product or rate edits do not rewrite history.

### Attribution

- Policy: **last valid click**
- Window: 30 days (configurable in `store_settings` key `affiliate_reseller`)
- Legacy `?ref=CODE` still works and is captured server-side
- New links: `/buy/{opaqueToken}` and `/a/{CODE}/{slug}`
- Removing the code from the URL does not clear the signed cookie
- Status is re-checked at checkout and at payment credit. Pending/suspended affiliates do not earn
- Disabled links cannot establish new attribution
- Price changes: quotes use the **current** catalog base so Vee-care never sells below today’s floor

Affiliate attribution is separate from Meta / UTM / `fbclid` / `_fbp` / `_fbc`. Those stay on `orders.metadata` unchanged. Meta Purchase value is the amount the customer paid (`orders.total`).

## Authentication

Public referral codes are **not** passwords. Partners sign in with a 6-digit email OTP. Existing accounts keep the same email; they request a code at `/affiliate`.

## Commission lifecycle

1. Customer pays the server-calculated selling total
2. Gateway callback/verify + `mark_order_paid`
3. `creditAffiliateCommission` inserts one row (`UNIQUE order_id`)
4. Status: pending → approved → paid (manual admin)
5. Cancel/refund reverses the earning (`cancelled` + `reversed_at`) without deleting history
6. If already paid to the affiliate, audit marks recovery required

Self-referral (same email/phone) is **flagged**, not auto-blocked.

## Admin

- `/admin/affiliates` — approve/suspend, rates, notes, approve/pay earnings
- Product form **Affiliate** tab — enable/disable, markup type, custom price bounds
- Order detail shows customer paid / Vee-care base / affiliate / shipping / discount

## Portal

`/affiliate/dashboard` · `/products` · `/links` · `/orders` · `/earnings` · `/payouts` · `/profile`

## Environment

Uses existing `AUTH_JWT_SECRET` (or `JWT_SECRET`) to sign attribution and portal sessions. `RESEND_API_KEY` sends OTP and approval emails. `NEXT_PUBLIC_APP_URL` builds share URLs.

## Migration

`supabase/migrations/20260902120000_affiliate_reseller_engine.sql`

- Adds nullable snapshot columns on `affiliate_commissions`
- Adds `affiliate_links`, `affiliate_visits`, `affiliate_audit_log`
- Adds OTP/payout columns on `affiliates`
- Backfills existing commissions
- Updates `credit_affiliate_commission` to prefer reseller snapshots

Existing affiliates and commission rows are preserved.

Apply on the VPS database (`store_veecare`) before or with deploy.

## Testing

```bash
npm test
```

Covers percentage, fixed, quantity, floor, min/max custom, price-change floor, mixed cart, discount allocation, pesewa precision.

## Future automatic payouts

Store payout network/account on the affiliate profile. Do not auto-disburse until a dedicated, idempotent payout job exists (MoMo/bank API, unique payout ids, reconciliation).
