import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

// Non-PII order confirmation lookup for the order-success page. Returns enough
// to render the confirmation (items, totals, status) WITHOUT exposing the
// customer's address, email or phone — so it is safe to call with just the
// order number after a payment redirect. PII for the buyer's own confirmation
// is rendered from the browser snapshot saved at checkout.
export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimit = checkRateLimit(`order-status:${clientId}`, RATE_LIMITS.notification);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { orderNumber } = await req.json();
        const ref = String(orderNumber || '').trim();
        if (!ref) {
            return NextResponse.json({ error: 'Order number is required.' }, { status: 400 });
        }

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(`
                order_number,
                status,
                payment_status,
                payment_method,
                payment_provider,
                total,
                subtotal,
                shipping_total,
                created_at,
                metadata,
                order_items (
                    id,
                    product_name,
                    variant_name,
                    quantity,
                    unit_price,
                    metadata
                )
            `)
            .eq('order_number', ref)
            .maybeSingle();

        if (error) {
            console.error('[Orders] Status error:', error.message);
            return NextResponse.json({ error: 'Could not load order.' }, { status: 500 });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
        }

        // Only surface a non-sensitive subset of metadata.
        const trackingNumber = (order.metadata as Record<string, unknown> | null)?.tracking_number ?? null;

        return NextResponse.json({
            order: {
                order_number: order.order_number,
                status: order.status,
                payment_status: order.payment_status,
                payment_method: order.payment_method,
                payment_provider: order.payment_provider,
                total: order.total,
                subtotal: order.subtotal,
                shipping_total: order.shipping_total,
                created_at: order.created_at,
                tracking_number: trackingNumber,
                order_items: order.order_items,
            },
        });
    } catch (err: unknown) {
        console.error('[Orders] Status exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
