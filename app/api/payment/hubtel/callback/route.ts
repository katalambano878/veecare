import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation, retryOrderNotificationsIfNeeded } from '@/lib/notifications';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { stripHubtelRetrySuffix, verifyHubtelTransaction } from '@/lib/payments/hubtel';

/**
 * Hubtel Online Checkout webhook payload (typical fields):
 * { ClientReference, Status, Amount, TransactionId, Description, ... }
 * No built-in signature — always verify via status API before marking paid.
 */

export async function POST(req: Request) {
    console.log('[Hubtel Callback] POST received at', new Date().toISOString());

    try {
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`callback:${clientId}`, RATE_LIMITS.callback);

        if (!rateLimitResult.success) {
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        let body: Record<string, unknown> = {};
        const contentType = req.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                body = await req.json();
            } else {
                const rawText = await req.text();
                try {
                    body = JSON.parse(rawText);
                } catch {
                    body = Object.fromEntries(new URLSearchParams(rawText).entries());
                }
            }
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid Request Body' }, { status: 400 });
        }

        const clientReference = String(
            body.ClientReference || body.clientReference || ''
        );
        const callbackStatus = body.Status || body.status;
        const transactionId = String(body.TransactionId || body.transactionId || 'callback');
        const callbackAmount = body.Amount != null ? Number(body.Amount) : (body.amount != null ? Number(body.amount) : null);

        console.log('[Hubtel Callback] Ref:', clientReference, '| Status:', callbackStatus, '| TxId:', transactionId);

        if (!clientReference) {
            return NextResponse.json({ success: false, message: 'Missing client reference' }, { status: 400 });
        }

        const merchantOrderRef = stripHubtelRetrySuffix(clientReference);

        const { data: existingOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, payment_status, total, metadata')
            .eq('order_number', merchantOrderRef)
            .single();

        if (fetchError || !existingOrder) {
            console.error('[Hubtel Callback] Order not found:', merchantOrderRef);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (existingOrder.payment_status === 'paid') {
            try {
                await retryOrderNotificationsIfNeeded(merchantOrderRef);
            } catch (notifyError: unknown) {
                console.error('[Hubtel Callback] Notification retry failed:', notifyError);
            }
            return NextResponse.json({ success: true, message: 'Order already processed' });
        }

        // Verify with Hubtel status API — do not trust webhook status alone
        const verification = await verifyHubtelTransaction(clientReference);
        const isSuccess = verification.verified;

        if (!isSuccess) {
            console.log('[Hubtel Callback] Payment not confirmed for', merchantOrderRef);

            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'failed',
                    metadata: {
                        ...(existingOrder.metadata || {}),
                        hubtel_reference: transactionId,
                        hubtel_client_reference: clientReference,
                        failure_reason: String(callbackStatus || verification.message || 'Payment failed'),
                    },
                })
                .eq('order_number', merchantOrderRef);

            return NextResponse.json({ success: false, message: 'Payment not successful' });
        }

        const paidAmount = verification.amount ?? callbackAmount;
        if (paidAmount !== null) {
            const expectedAmount = Number(existingOrder.total);
            if (Math.abs(paidAmount - expectedAmount) > 0.01) {
                console.error('[Hubtel Callback] AMOUNT MISMATCH — REJECTING!', expectedAmount, paidAmount);
                return NextResponse.json(
                    { success: false, message: 'Payment amount does not match order total' },
                    { status: 400 }
                );
            }
        }

        const hubtelRef = verification.transactionId || transactionId;

        const { data: orderJson, error: updateError } = await supabaseAdmin.rpc('mark_order_paid', {
            order_ref: merchantOrderRef,
            moolre_ref: hubtelRef,
        });

        if (updateError) {
            console.error('[Hubtel Callback] RPC Error:', updateError.message);
            return NextResponse.json({ success: false, message: 'Database update failed' }, { status: 500 });
        }

        if (!orderJson) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        await supabaseAdmin
            .from('orders')
            .update({
                metadata: {
                    ...(orderJson.metadata || {}),
                    payment_method: 'hubtel',
                    payment_provider: 'hubtel',
                    hubtel_reference: hubtelRef,
                    hubtel_client_reference: clientReference,
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
            console.error('[Hubtel Callback] Customer stats failed:', statsError);
        }

        try {
            await sendOrderConfirmation(orderJson);
        } catch (notifyError: unknown) {
            console.error('[Hubtel Callback] Notification failed:', notifyError);
        }

        return NextResponse.json({ success: true, message: 'Payment verified and order updated' });
    } catch (error: unknown) {
        console.error('[Hubtel Callback] Critical Error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Hubtel callback endpoint ready', timestamp: new Date().toISOString() });
}
