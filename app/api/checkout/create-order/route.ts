import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getActiveAttributionFromRequest } from '@/lib/reseller/attribution';
import { quoteCheckoutCart } from '@/lib/reseller/quote-order';

const TRACK_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Marketing attribution keys the browser may attach to an order (see lib/analytics/attribution.ts). */
const ATTRIBUTION_KEYS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'fbc', 'fbp', 'landing_page', 'referrer', 'user_agent',
]);
const ATTRIBUTION_VALUE_MAX = 512;

function pickAttribution(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(([key, value]) => ATTRIBUTION_KEYS.has(key) && typeof value === 'string' && value.length > 0)
      .map(([key, value]) => [key, String(value).slice(0, ATTRIBUTION_VALUE_MAX)])
  );
}

function trackingNumber() {
  const bytes = randomBytes(6);
  let id = '';
  for (let i = 0; i < 6; i++) id += TRACK_ALPHABET[bytes[i] % TRACK_ALPHABET.length];
  return `SLI-${id}`;
}

export async function POST(req: Request) {
  try {
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`checkout-create:${clientId}`, { maxRequests: 20, windowSeconds: 3600 });
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many checkout attempts. Try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const shipping = body.shipping || {};
    const email = String(shipping.email || '').trim().toLowerCase();
    const phone = String(shipping.phone || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const auth = await verifyAuth(req);
    const userId = auth.authenticated ? auth.user?.id || null : null;

    const attribution = await getActiveAttributionFromRequest(req);
    const quote = await quoteCheckoutCart({
      items: body.items,
      attribution,
      couponCode: body.couponCode || null,
      loyaltyPoints: body.useLoyaltyPoints ? Number(body.loyaltyPoints) || 0 : 0,
      customerEmail: email,
      customerPhone: phone,
    });

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const track = trackingNumber();
    const paymentMethod = body.paymentMethod === 'paystack' ? 'paystack' : 'moolre';

    const resellerMeta = quote.affiliate
      ? {
          reseller: {
            affiliate_id: quote.affiliate.id,
            affiliate_code: quote.affiliate.code,
            affiliate_rate_snapshot: quote.affiliate.commission_rate,
            link_id: quote.linkId,
            subtotal_base_amount: quote.subtotal_base_amount,
            affiliate_markup_total: quote.affiliate_markup_total,
            customer_subtotal: quote.customer_subtotal,
            shipping_amount: quote.shipping_amount,
            discount_amount: quote.discount_amount,
            tax_amount: quote.tax_amount,
            final_total: quote.final_total,
            self_referral_flag: quote.selfReferralFlag,
          },
          affiliate_id: quote.affiliate.id,
          affiliate_code: quote.affiliate.code,
          affiliate_commission_rate: quote.affiliate.commission_rate,
        }
      : {};

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        email,
        phone,
        status: 'pending',
        payment_status: 'pending',
        currency: 'GHS',
        subtotal: quote.customer_subtotal,
        tax_total: quote.tax_amount,
        shipping_total: quote.shipping_amount,
        discount_total: quote.discount_amount,
        total: quote.final_total,
        shipping_method: body.deliveryMethod || 'doorstep',
        payment_method: paymentMethod,
        payment_provider: paymentMethod,
        shipping_address: shipping,
        billing_address: shipping,
        metadata: {
          // Client attribution first so server-computed keys below always win.
          ...pickAttribution(body.attribution),
          guest_checkout: !userId,
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          tracking_number: track,
          payment_method: paymentMethod,
          payment_provider: paymentMethod,
          ...(body.couponCode ? { coupon_code: String(body.couponCode).toUpperCase() } : {}),
          ...(body.useLoyaltyPoints ? { loyalty_points_applied: true } : {}),
          ...resellerMeta,
          marketing_consent: Boolean(body.marketingConsent),
        },
      })
      .select('id, order_number, total, subtotal, discount_total, shipping_total')
      .single();

    if (orderError || !order) {
      console.error('[Checkout] create-order failed', orderError?.message);
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
    }

    const orderItems = quote.lines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      product_name: line.product_name,
      variant_name: line.variant_name,
      sku: line.sku,
      quantity: line.quantity,
      unit_price: line.unit_quote.affiliate_selling_price,
      total_price: line.line_selling_amount,
      metadata: {
        image: line.image,
        slug: line.slug,
        product_base_price: line.unit_quote.product_base_price,
        affiliate_markup_rate: line.unit_quote.affiliate_markup_rate,
        affiliate_markup_amount: line.unit_quote.affiliate_markup_amount,
        affiliate_selling_price: line.unit_quote.affiliate_selling_price,
        markup_type: line.unit_quote.markup_type,
        line_base_amount: line.line_base_amount,
        line_markup_amount: line.line_markup_amount,
        affiliate_enabled: line.affiliate_enabled,
      },
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('[Checkout] items insert failed', itemsError.message);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Could not create order items' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      trackingNumber: track,
      totals: {
        subtotal: order.subtotal,
        discount: order.discount_total,
        shipping: order.shipping_total,
        total: order.total,
      },
      items: orderItems,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not create order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
