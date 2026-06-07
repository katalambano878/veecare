import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import {
    initiateHubtelCheckout,
    isHubtelConfigured,
    generateHubtelClientReference,
} from '@/lib/payments/hubtel';

export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`payment:${clientId}`, RATE_LIMITS.payment);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, message: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimitResult.resetIn.toString(),
                    },
                }
            );
        }

        if (!isHubtelConfigured()) {
            console.error('[Hubtel] Missing credentials');
            return NextResponse.json(
                { success: false, message: 'Hubtel is not configured. Please choose Mobile Money (Moolre) or contact support.' },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { orderId } = body;

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ success: false, message: 'Missing or invalid orderId' }, { status: 400 });
        }

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, total, email, phone, payment_status, metadata, shipping_address')
            .or(`id.eq.${orderId},order_number.eq.${orderId}`)
            .single();

        if (orderError || !order) {
            console.error('[Hubtel] Order not found:', orderId);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (order.payment_status === 'paid') {
            return NextResponse.json({ success: false, message: 'Order is already paid' }, { status: 400 });
        }

        const amount = Number(order.total);
        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, message: 'Invalid order amount' }, { status: 400 });
        }

        const orderRef = order.order_number || orderId;
        const requestUrl = new URL(req.url);
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/+$/, '');

        const shipping = (order.shipping_address || {}) as Record<string, string>;
        const customerName =
            [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') ||
            (order.metadata as Record<string, string>)?.first_name ||
            'Customer';

        const clientReference = generateHubtelClientReference(orderRef);

        const result = await initiateHubtelCheckout({
            orderRef,
            amount,
            customerName,
            customerEmail: order.email,
            customerPhone: order.phone || shipping.phone || '',
            baseUrl,
            clientReference,
        });

        if (!result.success || !result.checkoutUrl) {
            return NextResponse.json(
                { success: false, message: result.message || 'Failed to generate payment link' },
                { status: 400 }
            );
        }

        await supabaseAdmin
            .from('orders')
            .update({
                payment_method: 'hubtel',
                payment_provider: 'hubtel',
                metadata: {
                    ...(order.metadata || {}),
                    payment_method: 'hubtel',
                    payment_provider: 'hubtel',
                    hubtel_client_reference: clientReference,
                },
            })
            .eq('id', order.id);

        console.log('[Hubtel] Initiated for order:', orderRef, '| Amount:', amount);

        return NextResponse.json({
            success: true,
            url: result.checkoutUrl,
            reference: clientReference,
        });
    } catch (error: unknown) {
        console.error('[Hubtel] Payment API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
