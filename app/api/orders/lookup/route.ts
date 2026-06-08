import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

// Email-gated full order lookup for order tracking. Returns the complete order
// (including shipping address) ONLY when the supplied email matches the order.
// This replaces the old anon RLS read so guest orders can no longer be
// enumerated with the public key.
export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimit = checkRateLimit(`order-lookup:${clientId}`, RATE_LIMITS.notification);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { orderNumber, email } = await req.json();
        const ref = String(orderNumber || '').trim();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!ref || !normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json({ error: 'Order number and a valid email are required.' }, { status: 400 });
        }

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(`
                id,
                order_number,
                status,
                payment_status,
                total,
                subtotal,
                shipping_total,
                email,
                phone,
                created_at,
                shipping_address,
                metadata,
                order_items (
                    id,
                    product_name,
                    variant_name,
                    quantity,
                    unit_price,
                    metadata,
                    products ( product_images (url) )
                )
            `)
            .eq('order_number', ref)
            .maybeSingle();

        if (error) {
            console.error('[Orders] Lookup error:', error.message);
            return NextResponse.json({ error: 'Could not load order.' }, { status: 500 });
        }

        // Generic message either way to avoid leaking which order numbers exist.
        if (!order || order.email?.toLowerCase() !== normalizedEmail) {
            return NextResponse.json(
                { error: 'No order found matching that order number and email.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ order });
    } catch (err: unknown) {
        console.error('[Orders] Lookup exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
