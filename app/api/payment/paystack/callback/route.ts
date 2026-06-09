import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation, retryOrderNotificationsIfNeeded } from '@/lib/notifications';
import { creditAffiliateCommission } from '@/lib/affiliate';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import {
    stripPaystackRetrySuffix,
    verifyPaystackTransaction,
    verifyPaystackSignature,
} from '@/lib/payments/paystack';

/**
 * Paystack webhook. Paystack signs every event with an HMAC SHA512 of the raw
 * body using your secret key (header: x-paystack-signature). We verify that
 * signature, then independently confirm the transaction via Paystack's verify
 * API before marking the order paid.
 */
export async function POST(req: Request) {
    console.log('[Paystack Callback] POST received at', new Date().toISOString());

    try {
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`callback:${clientId}`, RATE_LIMITS.callback);

        if (!rateLimitResult.success) {
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        // Read the raw body so we can validate the signature byte-for-byte.
        const rawBody = await req.text();
        const signature = req.headers.get('x-paystack-signature');

        if (!verifyPaystackSignature(rawBody, signature)) {
            console.error('[Paystack Callback] Invalid signature — rejecting.');
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
        }

        let body: Record<string, unknown> = {};
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid Request Body' }, { status: 400 });
        }

        const event = String(body.event || '');
        const data = (body.data || {}) as Record<string, unknown>;
        const reference = String(data.reference || '');

        console.log('[Paystack Callback] Event:', event, '| Ref:', reference);

        if (!reference) {
            return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 });
        }

        // We only act on successful charges. Acknowledge others so Paystack stops retrying.
        if (event !== 'charge.success') {
            return NextResponse.json({ success: true, message: 'Event ignored' });
        }

        const merchantOrderRef = stripPaystackRetrySuffix(reference);

        const { data: existingOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, payment_status, total, metadata')
            .eq('order_number', merchantOrderRef)
            .single();

        if (fetchError || !existingOrder) {
            console.error('[Paystack Callback] Order not found:', merchantOrderRef);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (existingOrder.payment_status === 'paid') {
            try {
                await retryOrderNotificationsIfNeeded(merchantOrderRef);
            } catch (notifyError: unknown) {
                console.error('[Paystack Callback] Notification retry failed:', notifyError);
            }
            return NextResponse.json({ success: true, message: 'Order already processed' });
        }

        // Independently confirm with Paystack's verify API — do not trust the webhook body alone.
        const verification = await verifyPaystackTransaction(reference);

        if (!verification.verified) {
            console.log('[Paystack Callback] Payment not confirmed for', merchantOrderRef);
            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'failed',
                    metadata: {
                        ...(existingOrder.metadata || {}),
                        paystack_reference: reference,
                        failure_reason: verification.status || verification.message || 'Payment not successful',
                    },
                })
                .eq('order_number', merchantOrderRef);
            return NextResponse.json({ success: false, message: 'Payment not successful' });
        }

        // Verify the amount matches the order total.
        if (verification.amount != null) {
            const expectedAmount = Number(existingOrder.total);
            if (Math.abs(verification.amount - expectedAmount) > 0.01) {
                console.error('[Paystack Callback] AMOUNT MISMATCH — REJECTING!', expectedAmount, verification.amount);
                return NextResponse.json(
                    { success: false, message: 'Payment amount does not match order total' },
                    { status: 400 }
                );
            }
        }

        const paystackRef = verification.transactionId || reference;

        const { data: orderJson, error: updateError } = await supabaseAdmin.rpc('mark_order_paid', {
            order_ref: merchantOrderRef,
            moolre_ref: paystackRef,
        });

        if (updateError) {
            console.error('[Paystack Callback] RPC Error:', updateError.message);
            return NextResponse.json({ success: false, message: 'Database update failed' }, { status: 500 });
        }

        if (!orderJson) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        await supabaseAdmin
            .from('orders')
            .update({
                metadata: {
                    ...(orderJson.metadata || existingOrder.metadata || {}),
                    payment_method: 'paystack',
                    payment_provider: 'paystack',
                    paystack_reference: reference,
                    paystack_transaction_id: paystackRef,
                },
            })
            .eq('order_number', merchantOrderRef);

        try {
            if (orderJson.email) {
                await supabaseAdmin.rpc('update_customer_stats', {
                    p_customer_email: orderJson.email,
                    p_order_total: orderJson.total,
                });
            }
        } catch (statsError: unknown) {
            console.error('[Paystack Callback] Customer stats failed:', statsError);
        }

        try {
            await creditAffiliateCommission(orderJson.id);
        } catch (affiliateError: unknown) {
            console.error('[Paystack Callback] Affiliate commission failed:', affiliateError);
        }

        try {
            await sendOrderConfirmation(orderJson);
        } catch (notifyError: unknown) {
            console.error('[Paystack Callback] Notification failed:', notifyError);
        }

        return NextResponse.json({ success: true, message: 'Payment verified and order updated' });
    } catch (error: unknown) {
        console.error('[Paystack Callback] Critical Error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Paystack callback endpoint ready', timestamp: new Date().toISOString() });
}
