import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { validateCouponRecord } from '@/lib/coupons';

export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimit = checkRateLimit(`coupon-validate:${clientId}`, RATE_LIMITS.notification);
        if (!rateLimit.success) {
            return NextResponse.json({ valid: false, reason: 'Too many requests' }, { status: 429 });
        }

        const { code, subtotal, shippingCost } = await req.json();
        const trimmed = String(code || '').trim().toUpperCase();

        if (!trimmed) {
            return NextResponse.json({ valid: false, reason: 'Please enter a coupon code.' }, { status: 400 });
        }

        const cartSubtotal = Number(subtotal) || 0;
        const shipping = Number(shippingCost) || 0;

        const { data, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .ilike('code', trimmed)
            .maybeSingle();

        if (error || !data) {
            return NextResponse.json({ valid: false, reason: 'This coupon code does not exist.' });
        }

        const result = validateCouponRecord(data, cartSubtotal, shipping);
        if (!result.valid || !result.coupon) {
            return NextResponse.json({ valid: false, reason: result.reason || 'Invalid coupon.' });
        }

        return NextResponse.json({
            valid: true,
            coupon: result.coupon,
            discountAmount: result.discountAmount,
        });
    } catch (err: unknown) {
        console.error('[Coupons] Validate error:', err);
        return NextResponse.json({ valid: false, reason: 'Could not validate coupon.' }, { status: 500 });
    }
}
