import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { validateCouponRecord } from '@/lib/coupons';

/** Increment coupon usage after an order is successfully created. */
export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimit = checkRateLimit(`coupon-redeem:${clientId}`, RATE_LIMITS.notification);
        if (!rateLimit.success) {
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        const { code, orderNumber, subtotal, discountAmount } = await req.json();
        const trimmed = String(code || '').trim().toUpperCase();
        const orderRef = String(orderNumber || '').trim();

        if (!trimmed || !orderRef) {
            return NextResponse.json({ success: false, message: 'Missing coupon or order' }, { status: 400 });
        }

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, subtotal, discount_total, metadata, created_at')
            .eq('order_number', orderRef)
            .maybeSingle();

        if (orderError || !order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Only redeem for orders created in the last 15 minutes.
        const orderAge = Date.now() - new Date(order.created_at).getTime();
        if (orderAge > 15 * 60 * 1000) {
            return NextResponse.json({ success: false, message: 'Order too old to redeem coupon' }, { status: 400 });
        }

        const { data: coupon, error: couponError } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .ilike('code', trimmed)
            .maybeSingle();

        if (couponError || !coupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }

        const validation = validateCouponRecord(coupon, Number(subtotal ?? order.subtotal) || 0);
        if (!validation.valid) {
            return NextResponse.json({ success: false, message: validation.reason }, { status: 400 });
        }

        const expectedDiscount = validation.discountAmount ?? 0;
        const reportedDiscount = Number(discountAmount ?? order.discount_total) || 0;
        if (Math.abs(expectedDiscount - reportedDiscount) > 0.02) {
            return NextResponse.json({ success: false, message: 'Discount mismatch' }, { status: 400 });
        }

        const { error: updateError } = await supabaseAdmin
            .from('coupons')
            .update({ usage_count: Number(coupon.usage_count ?? 0) + 1 })
            .eq('id', coupon.id);

        if (updateError) {
            console.error('[Coupons] Redeem update error:', updateError.message);
            return NextResponse.json({ success: false, message: 'Failed to record coupon use' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error('[Coupons] Redeem error:', err);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
