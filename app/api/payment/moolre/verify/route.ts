import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation, retryOrderNotificationsIfNeeded } from '@/lib/notifications';
import { creditAffiliateCommission } from '@/lib/affiliate';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyMoolreExternalRef } from '@/lib/payments/moolre-verify';
import { recordPaymentEvent } from '@/lib/payments/payment-events';

/**
 * Payment verification endpoint.
 * Called from the order-success page after the user completes payment on Moolre.
 * 
 * SECURITY: We ONLY trust Moolre's API response for payment verification.
 * The `fromRedirect` flag is NO LONGER trusted as proof of payment,
 * because anyone could forge that request.
 */
export async function POST(req: Request) {
    try {
        // Rate limiting
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`verify:${clientId}`, RATE_LIMITS.payment);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, message: 'Too many requests' },
                { status: 429 }
            );
        }

        const { orderNumber } = await req.json();

        if (!orderNumber || typeof orderNumber !== 'string') {
            return NextResponse.json({ success: false, message: 'Missing or invalid orderNumber' }, { status: 400 });
        }

        // Sanitize: only allow expected order number format
        if (!/^ORD-\d+-\d+$/.test(orderNumber)) {
            return NextResponse.json({ success: false, message: 'Invalid order number format' }, { status: 400 });
        }

        console.log('[Verify] Checking payment for:', orderNumber);

        // 1. Check current order status
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, payment_status, status, total, email, phone, shipping_address, metadata')
            .eq('order_number', orderNumber)
            .single();

        if (fetchError || !order) {
            console.error('[Verify] Order not found:', orderNumber);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Already paid — retry notifications if a previous attempt failed
        if (order.payment_status === 'paid') {
            console.log('[Verify] Order already paid, checking notifications:', orderNumber);
            try {
                await retryOrderNotificationsIfNeeded(orderNumber);
            } catch (notifyError: unknown) {
                console.error('[Verify] Notification retry failed:', notifyError);
            }
            return NextResponse.json({
                success: true,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Order already paid'
            });
        }

        // 2. Verify payment method is moolre
        if (order.metadata?.payment_method && order.metadata.payment_method !== 'moolre') {
            return NextResponse.json({
                success: false,
                message: 'This order does not use Moolre payment'
            }, { status: 400 });
        }

        // 3. ONLY verify with Moolre's API — no more trusting client-side flags
        let moolreApiVerified = false;

        if (!process.env.MOOLRE_API_USER || !process.env.MOOLRE_API_PUBKEY || !process.env.MOOLRE_ACCOUNT_NUMBER) {
            console.error('[Verify] Missing Moolre API credentials');
            return NextResponse.json({
                success: false,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Payment verification unavailable'
            }, { status: 503 });
        }

        // Use the actual external reference sent to Moolre during payment init,
        // NOT the bare order number. Moolre only knows the uniqueRef with the -R{ts} suffix.
        const externalRefToCheck = order.metadata?.moolre_externalref || orderNumber;
        const apiCheck = await verifyMoolreExternalRef(String(externalRefToCheck), Number(order.total));
        console.log('[Verify] Moolre status:', apiCheck.rawStatus, apiCheck.error || 'ok', 'amount=', apiCheck.amount);
        moolreApiVerified = apiCheck.verified;

        // 4. Only proceed if Moolre API confirmed payment
        if (!moolreApiVerified) {
            console.log('[Verify] Cannot verify payment for:', orderNumber);
            return NextResponse.json({
                success: false,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Payment not yet confirmed by payment provider'
            });
        }

        console.log('[Verify] Marking order paid via moolre-api for:', orderNumber);

        // 5. Mark as paid (prefer real Moolre transaction id when present in status payload)
        const moolreRef = apiCheck.transactionId || 'moolre-api-verify';
        await recordPaymentEvent({
            gateway: 'moolre',
            eventType: 'verify',
            externalEventId: `verify:${orderNumber}:${moolreRef}`,
            orderNumber,
            reference: String(externalRefToCheck),
            processingStatus: 'received',
        });

        const { data: orderJson, error: updateError } = await supabaseAdmin
            .rpc('mark_order_paid', {
                order_ref: orderNumber,
                moolre_ref: String(moolreRef).slice(0, 64)
            });

        if (updateError) {
            console.error('[Verify] RPC Error:', updateError.message);
            await recordPaymentEvent({
                gateway: 'moolre',
                eventType: 'verify_result',
                externalEventId: `verify:${orderNumber}:${moolreRef}:fail`,
                orderNumber,
                reference: String(moolreRef),
                processingStatus: 'failed',
                errorMessage: updateError.message,
            });
            return NextResponse.json({ success: false, message: 'Failed to update order' }, { status: 500 });
        }

        console.log('[Verify] Order marked as paid:', orderNumber);

        // 6. Update customer stats
        if (orderJson?.email) {
            try {
                await supabaseAdmin.rpc('update_customer_stats', {
                    p_customer_email: orderJson.email,
                    p_order_total: orderJson.total
                });
            } catch (statsError: any) {
                console.error('[Verify] Customer stats failed:', statsError.message);
            }
        }

        if (orderJson?.id) {
            try {
                await creditAffiliateCommission(orderJson.id);
            } catch (affiliateError: unknown) {
                console.error('[Verify] Affiliate commission failed:', affiliateError);
            }
        }

        // 7. Send notifications (SMS + Email)
        if (orderJson) {
            try {
                await sendOrderConfirmation(orderJson);
                console.log('[Verify] Notifications sent for:', orderNumber);
            } catch (notifyError: any) {
                console.error('[Verify] Notification failed:', notifyError.message);
            }
        }

        await recordPaymentEvent({
            gateway: 'moolre',
            eventType: 'verify_result',
            externalEventId: `verify:${orderNumber}:${moolreRef}:ok`,
            orderNumber,
            reference: String(moolreRef),
            processingStatus: 'processed',
        });

        return NextResponse.json({
            success: true,
            status: 'processing',
            payment_status: 'paid',
            message: 'Payment verified and order updated'
        });

    } catch (error: any) {
        console.error('[Verify] Error:', error.message);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
