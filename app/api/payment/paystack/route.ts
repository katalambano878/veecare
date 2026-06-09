import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import {
    initiatePaystackTransaction,
    isPaystackConfigured,
    generatePaystackReference,
} from '@/lib/payments/paystack';

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

        if (!isPaystackConfigured()) {
            console.error('[Paystack] Missing credentials');
            return NextResponse.json(
                { success: false, message: 'Paystack is not configured. Please choose Mobile Money (Moolre) or contact support.' },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { orderId, customerEmail } = body;

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ success: false, message: 'Missing or invalid orderId' }, { status: 400 });
        }

        // SECURITY: fetch the order and use its DB total — never trust client amount.
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, total, email, phone, payment_status, metadata')
            .eq('order_number', orderId)
            .single();

        if (orderError || !order) {
            console.error('[Paystack] Order not found:', orderId);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (order.payment_status === 'paid') {
            return NextResponse.json({ success: false, message: 'Order is already paid' }, { status: 400 });
        }

        const amount = Number(order.total);
        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, message: 'Invalid order amount' }, { status: 400 });
        }

        const customerEmailToUse = order.email || customerEmail;
        if (!customerEmailToUse) {
            return NextResponse.json({ success: false, message: 'A customer email is required for Paystack' }, { status: 400 });
        }

        const orderRef = order.order_number || orderId;
        const requestUrl = new URL(req.url);
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/+$/, '');

        const reference = generatePaystackReference(orderRef);

        const result = await initiatePaystackTransaction({
            orderRef,
            amount,
            customerEmail: customerEmailToUse,
            baseUrl,
            reference,
        });

        if (!result.success || !result.authorizationUrl) {
            return NextResponse.json(
                { success: false, message: result.message || 'Failed to generate payment link' },
                { status: 400 }
            );
        }

        await supabaseAdmin
            .from('orders')
            .update({
                payment_method: 'paystack',
                payment_provider: 'paystack',
                metadata: {
                    ...(order.metadata || {}),
                    payment_method: 'paystack',
                    payment_provider: 'paystack',
                    paystack_reference: result.reference,
                    payment_attempted_at: new Date().toISOString(),
                },
            })
            .eq('id', order.id);

        console.log('[Paystack] Initiated for order:', orderRef, '| Amount:', amount);

        return NextResponse.json({
            success: true,
            url: result.authorizationUrl,
            reference: result.reference,
        });
    } catch (error: unknown) {
        console.error('[Paystack] Payment API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
