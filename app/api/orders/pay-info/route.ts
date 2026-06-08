import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lookup for the "complete payment" page (/pay/[orderId]). Pay links are private
// and reference either the order UUID or order number. Returns only the fields
// needed to initialise payment.
export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimit = checkRateLimit(`order-payinfo:${clientId}`, RATE_LIMITS.notification);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { ref } = await req.json();
        const value = String(ref || '').trim();
        if (!value) {
            return NextResponse.json({ error: 'Order reference is required.' }, { status: 400 });
        }

        const column = UUID_RE.test(value) ? 'id' : 'order_number';

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, payment_status, payment_method, total, email, metadata')
            .eq(column, value)
            .maybeSingle();

        if (error) {
            console.error('[Orders] Pay-info error:', error.message);
            return NextResponse.json({ error: 'Could not load order.' }, { status: 500 });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (err: unknown) {
        console.error('[Orders] Pay-info exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
