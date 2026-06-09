/**
 * Paystack payment helpers (redirect/checkout flow).
 * Docs: https://paystack.com/docs/payments/accept-payments/
 *
 * Flow:
 *  1. initialize transaction  -> redirect customer to authorization_url
 *  2. Paystack redirects back to callback_url (order-success page)
 *  3. Paystack also POSTs a signed webhook to /api/payment/paystack/callback
 *  4. We ALWAYS confirm with the verify endpoint before marking an order paid.
 */

import crypto from 'crypto';

export const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

export function isPaystackConfigured(): boolean {
    return !!process.env.PAYSTACK_SECRET_KEY;
}

function getSecretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error('Paystack secret key not configured');
    return key;
}

/** Unique per-attempt reference so retries don't collide; suffix is stripped to recover the order number. */
export function generatePaystackReference(orderRef: string): string {
    return `${orderRef}-R${Date.now()}`;
}

export function stripPaystackRetrySuffix(ref: string): string {
    return ref.replace(/-R\d+$/, '');
}

export interface PaystackInitParams {
    orderRef: string;
    /** Amount in major units (GHS). Converted to subunits (pesewas) internally. */
    amount: number;
    customerEmail: string;
    baseUrl: string;
    reference?: string;
    metadata?: Record<string, unknown>;
}

export interface PaystackInitResult {
    success: boolean;
    authorizationUrl?: string;
    reference: string;
    message?: string;
}

export async function initiatePaystackTransaction(
    params: PaystackInitParams
): Promise<PaystackInitResult> {
    if (!isPaystackConfigured()) {
        return { success: false, reference: '', message: 'Paystack not configured' };
    }

    const reference = params.reference || generatePaystackReference(params.orderRef);
    const baseUrl = params.baseUrl.replace(/\/+$/, '');
    // Paystack expects the amount in the currency's subunit (pesewas for GHS).
    const amountSubunits = Math.round(params.amount * 100);

    const payload = {
        email: params.customerEmail,
        amount: amountSubunits,
        currency: process.env.PAYSTACK_CURRENCY || 'GHS',
        reference,
        callback_url: `${baseUrl}/order-success?order=${encodeURIComponent(params.orderRef)}&payment_success=true`,
        metadata: {
            order_number: params.orderRef,
            ...(params.metadata || {}),
        },
    };

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${getSecretKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (result.status === true && result.data?.authorization_url) {
        return {
            success: true,
            authorizationUrl: result.data.authorization_url,
            reference: result.data.reference || reference,
        };
    }

    return {
        success: false,
        reference,
        message: result.message || 'Failed to create Paystack transaction',
    };
}

export interface PaystackVerifyResult {
    verified: boolean;
    status?: string;
    reference?: string;
    /** Amount in major units (GHS). */
    amount?: number;
    transactionId?: string;
    message?: string;
}

/** Server-side status check — never trust the redirect or webhook payload alone. */
export async function verifyPaystackTransaction(
    reference: string
): Promise<PaystackVerifyResult> {
    if (!isPaystackConfigured()) {
        return { verified: false, message: 'Paystack not configured' };
    }

    const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${getSecretKey()}`,
                'Content-Type': 'application/json',
            },
        }
    );

    const result = await response.json().catch(() => ({}));
    const data = result.data || {};
    const status = String(data.status || '').toLowerCase();

    return {
        verified: result.status === true && status === 'success',
        status: data.status,
        reference: data.reference,
        amount: data.amount != null ? Number(data.amount) / 100 : undefined,
        transactionId: data.id != null ? String(data.id) : undefined,
        message: result.message,
    };
}

/** Validate the Paystack webhook signature (HMAC SHA512 of the raw body with the secret key). */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) return false;

    const expected = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
        return false;
    }
}
