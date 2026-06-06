/**
 * Hubtel Online Checkout (redirect) helpers.
 * Docs: https://developers.hubtel.com/
 */

export const HUBTEL_CHECKOUT_URL =
    process.env.HUBTEL_ONLINE_CHECKOUT_URL || 'https://payproxyapi.hubtel.com/items/initiate';

export const HUBTEL_STATUS_BASE =
    process.env.HUBTEL_STATUS_URL || 'https://api-txnstatus.hubtel.com/transactions';

export function isHubtelConfigured(): boolean {
    return !!(
        process.env.HUBTEL_CLIENT_ID &&
        process.env.HUBTEL_CLIENT_SECRET &&
        process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER
    );
}

export function getHubtelAuthHeader(): string {
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Hubtel credentials not configured');
    }
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    return `Basic ${auth}`;
}

/** Normalize phone to Hubtel format (233XXXXXXXXX). */
export function formatGhanaPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('233')) return digits;
    if (digits.startsWith('0')) return `233${digits.slice(1)}`;
    if (digits.length === 9) return `233${digits}`;
    return digits;
}

export function stripHubtelRetrySuffix(ref: string): string {
    return ref.replace(/-R\d+$/, '');
}

export function generateHubtelClientReference(orderRef: string): string {
    return `${orderRef}-R${Date.now()}`;
}

export interface HubtelCheckoutParams {
    orderRef: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    baseUrl: string;
    clientReference?: string;
}

export interface HubtelCheckoutResult {
    success: boolean;
    checkoutUrl?: string;
    clientReference: string;
    message?: string;
}

export async function initiateHubtelCheckout(
    params: HubtelCheckoutParams
): Promise<HubtelCheckoutResult> {
    if (!isHubtelConfigured()) {
        return { success: false, clientReference: '', message: 'Hubtel not configured' };
    }

    const clientReference = params.clientReference || generateHubtelClientReference(params.orderRef);
    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER!;
    const baseUrl = params.baseUrl.replace(/\/+$/, '');

    const payload = {
        merchantAccountNumber: merchantAccount,
        totalAmount: params.amount,
        title: `Vee Care Order ${params.orderRef}`,
        description: `Payment for order ${params.orderRef}`,
        callbackUrl: `${baseUrl}/api/payment/hubtel/callback`,
        returnUrl: `${baseUrl}/order-success?order=${encodeURIComponent(params.orderRef)}&payment_success=true`,
        cancellationUrl: `${baseUrl}/pay/${encodeURIComponent(params.orderRef)}?cancelled=true`,
        payeeName: params.customerName || 'Customer',
        payeeEmail: params.customerEmail || '',
        payeeMobileNumber: formatGhanaPhone(params.customerPhone),
        clientReference,
    };

    const response = await fetch(HUBTEL_CHECKOUT_URL, {
        method: 'POST',
        headers: {
            Authorization: getHubtelAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (result.responseCode === '0000' && result.data?.checkoutUrl) {
        return {
            success: true,
            checkoutUrl: result.data.checkoutUrl,
            clientReference,
        };
    }

    return {
        success: false,
        clientReference,
        message: result.message || result.responseMessage || 'Failed to create Hubtel checkout',
    };
}

export interface HubtelVerifyResult {
    verified: boolean;
    status?: string;
    transactionId?: string;
    amount?: number;
    message?: string;
}

/** Server-side status check — never trust redirect or webhook alone. */
export async function verifyHubtelTransaction(
    clientReference: string
): Promise<HubtelVerifyResult> {
    if (!isHubtelConfigured()) {
        return { verified: false, message: 'Hubtel not configured' };
    }

    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER!;
    const url = `${HUBTEL_STATUS_BASE}/${merchantAccount}/status?clientReference=${encodeURIComponent(clientReference)}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: getHubtelAuthHeader(),
            'Content-Type': 'application/json',
        },
    });

    const result = await response.json().catch(() => ({}));
    const data = result.data || result;
    const status = String(data.status || data.Status || '').toLowerCase();
    const transactionId = data.transactionId || data.TransactionId || data.hubtelTransactionId;
    const amount = data.amount != null ? Number(data.amount) : (data.Amount != null ? Number(data.Amount) : undefined);

    const verified =
        status === 'paid' ||
        status === 'success' ||
        status === 'successful' ||
        status === 'completed';

    return {
        verified,
        status: data.status || data.Status,
        transactionId: transactionId ? String(transactionId) : undefined,
        amount,
        message: result.message || result.responseMessage,
    };
}

export function isHubtelSuccessStatus(status: unknown): boolean {
    const s = String(status || '').toLowerCase();
    return s === 'paid' || s === 'success' || s === 'successful' || s === 'completed';
}
