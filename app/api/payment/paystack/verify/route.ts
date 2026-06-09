import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation, retryOrderNotificationsIfNeeded } from '@/lib/notifications';
import { creditAffiliateCommission } from '@/lib/affiliate';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import {
    isPaystackConfigured,
    verifyPaystackTransaction,
    type PaystackVerifyResult,
} from '@/lib/payments/paystack';

/**
 * Payment verification for Paystack orders.
 * Called from order-success after redirect. Verifies via Paystack's API only.
 */
export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`verify:${clientId}`, RATE_LIMITS.payment);

        if (!rateLimitResult.success) {
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        const { orderNumber } = await req.json();

        if (!orderNumber || typeof orderNumber !== 'string') {
            return NextResponse.json({ success: false, message: 'Missing or invalid orderNumber' }, { status: 400 });
        }

        if (!/^ORD-\d+-\d+$/.test(orderNumber)) {
            return NextResponse.json({ success: false, message: 'Invalid order number format' }, { status: 400 });
        }

        console.log('[Paystack Verify] Checking payment for:', orderNumber);

        const { data: order, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, payment_status, status, total, email, phone, shipping_address, metadata, payment_method')
            .eq('order_number', orderNumber)
            .single();

        if (fetchError || !order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (order.payment_status === 'paid') {
            try {
                await retryOrderNotificationsIfNeeded(orderNumber);
            } catch (notifyError: unknown) {
                console.error('[Paystack Verify] Notification retry failed:', notifyError);
            }
            return NextResponse.json({
                success: true,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Order already paid',
            });
        }

        const paymentMethod = order.payment_method || order.metadata?.payment_method;
        if (paymentMethod && paymentMethod !== 'paystack') {
            return NextResponse.json({
                success: false,
                message: 'This order does not use Paystack payment',
            }, { status: 400 });
        }

        if (!isPaystackConfigured()) {
            return NextResponse.json({
                success: false,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Payment verification unavailable',
            }, { status: 503 });
        }

        const metadata = order.metadata || {};
        const refsToTry = [
            metadata.paystack_reference as string | undefined,
            orderNumber,
        ].filter((ref): ref is string => !!ref);

        let verification: PaystackVerifyResult = { verified: false };
        let matchedReference = refsToTry[0] || orderNumber;

        for (const ref of refsToTry) {
            const result = await verifyPaystackTransaction(ref);
            console.log('[Paystack Verify] API result for', ref, ':', result.verified, result.status);
            if (result.verified) {
                verification = result;
                matchedReference = ref;
                break;
            }
        }

        if (!verification.verified) {
            return NextResponse.json({
                success: false,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Payment not yet confirmed by payment provider',
            });
        }

        if (verification.amount != null) {
            const expectedAmount = Number(order.total);
            if (Math.abs(verification.amount - expectedAmount) > 0.01) {
                console.error('[Paystack Verify] AMOUNT MISMATCH!', expectedAmount, verification.amount);
                return NextResponse.json({
                    success: false,
                    message: 'Payment amount does not match order total',
                }, { status: 400 });
            }
        }

        const paystackRef = verification.transactionId || 'paystack-api-verify';

        const { data: orderJson, error: updateError } = await supabaseAdmin.rpc('mark_order_paid', {
            order_ref: orderNumber,
            moolre_ref: paystackRef,
        });

        if (updateError) {
            console.error('[Paystack Verify] RPC Error:', updateError.message);
            return NextResponse.json({ success: false, message: 'Failed to update order' }, { status: 500 });
        }

        await supabaseAdmin
            .from('orders')
            .update({
                metadata: {
                    ...(orderJson?.metadata || metadata),
                    payment_method: 'paystack',
                    payment_provider: 'paystack',
                    paystack_transaction_id: paystackRef,
                    paystack_reference: matchedReference,
                },
            })
            .eq('order_number', orderNumber);

        if (orderJson?.email) {
            try {
                await supabaseAdmin.rpc('update_customer_stats', {
                    p_customer_email: orderJson.email,
                    p_order_total: orderJson.total,
                });
            } catch (statsError: unknown) {
                console.error('[Paystack Verify] Customer stats failed:', statsError);
            }
        }

        if (orderJson?.id) {
            try {
                await creditAffiliateCommission(orderJson.id);
            } catch (affiliateError: unknown) {
                console.error('[Paystack Verify] Affiliate commission failed:', affiliateError);
            }
        }

        if (orderJson) {
            try {
                await sendOrderConfirmation(orderJson);
            } catch (notifyError: unknown) {
                console.error('[Paystack Verify] Notification failed:', notifyError);
            }
        }

        return NextResponse.json({
            success: true,
            status: 'processing',
            payment_status: 'paid',
            message: 'Payment verified and order updated',
        });
    } catch (error: unknown) {
        console.error('[Paystack Verify] Error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
