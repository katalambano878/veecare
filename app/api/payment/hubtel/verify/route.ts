import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation, retryOrderNotificationsIfNeeded } from '@/lib/notifications';
import { creditAffiliateCommission } from '@/lib/affiliate';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { isHubtelConfigured, verifyHubtelTransaction, type HubtelVerifyResult } from '@/lib/payments/hubtel';

/**
 * Payment verification for Hubtel orders.
 * Called from order-success after redirect. Verifies via Hubtel status API only.
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

        console.log('[Hubtel Verify] Checking payment for:', orderNumber);

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
                console.error('[Hubtel Verify] Notification retry failed:', notifyError);
            }
            return NextResponse.json({
                success: true,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Order already paid',
            });
        }

        const paymentMethod = order.payment_method || order.metadata?.payment_method;
        if (paymentMethod && paymentMethod !== 'hubtel') {
            return NextResponse.json({
                success: false,
                message: 'This order does not use Hubtel payment',
            }, { status: 400 });
        }

        if (!isHubtelConfigured()) {
            return NextResponse.json({
                success: false,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Payment verification unavailable',
            }, { status: 503 });
        }

        const metadata = order.metadata || {};
        const refsToTry = [
            metadata.hubtel_client_reference as string | undefined,
            orderNumber,
        ].filter((ref): ref is string => !!ref);

        let verification: HubtelVerifyResult = { verified: false };
        let matchedReference = refsToTry[0] || orderNumber;

        for (const ref of refsToTry) {
            const result = await verifyHubtelTransaction(ref);
            console.log('[Hubtel Verify] API result for', ref, ':', result);
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
                console.error('[Hubtel Verify] AMOUNT MISMATCH!', expectedAmount, verification.amount);
                return NextResponse.json({
                    success: false,
                    message: 'Payment amount does not match order total',
                }, { status: 400 });
            }
        }

        const hubtelRef = verification.transactionId || 'hubtel-api-verify';

        const { data: orderJson, error: updateError } = await supabaseAdmin.rpc('mark_order_paid', {
            order_ref: orderNumber,
            moolre_ref: hubtelRef,
        });

        if (updateError) {
            console.error('[Hubtel Verify] RPC Error:', updateError.message);
            return NextResponse.json({ success: false, message: 'Failed to update order' }, { status: 500 });
        }

        await supabaseAdmin
            .from('orders')
            .update({
                metadata: {
                    ...(orderJson?.metadata || metadata),
                    payment_method: 'hubtel',
                    payment_provider: 'hubtel',
                    hubtel_reference: hubtelRef,
                    hubtel_client_reference: matchedReference,
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
                console.error('[Hubtel Verify] Customer stats failed:', statsError);
            }
        }

        if (orderJson?.id) {
            try {
                await creditAffiliateCommission(orderJson.id);
            } catch (affiliateError: unknown) {
                console.error('[Hubtel Verify] Affiliate commission failed:', affiliateError);
            }
        }

        if (orderJson) {
            try {
                await sendOrderConfirmation(orderJson);
            } catch (notifyError: unknown) {
                console.error('[Hubtel Verify] Notification failed:', notifyError);
            }
        }

        return NextResponse.json({
            success: true,
            status: 'processing',
            payment_status: 'paid',
            message: 'Payment verified and order updated',
        });
    } catch (error: unknown) {
        console.error('[Hubtel Verify] Error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
