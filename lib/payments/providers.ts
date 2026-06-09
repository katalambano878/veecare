export type PaymentProvider = 'paystack' | 'moolre';

export const PAYMENT_ENDPOINTS: Record<
    PaymentProvider,
    { initiate: string; verify: string; label: string }
> = {
    paystack: {
        initiate: '/api/payment/paystack',
        verify: '/api/payment/paystack/verify',
        label: 'Paystack',
    },
    moolre: {
        initiate: '/api/payment/moolre',
        verify: '/api/payment/moolre/verify',
        label: 'Moolre',
    },
};

export function resolvePaymentProvider(
    paymentMethod?: string | null,
    metadata?: Record<string, unknown> | null
): PaymentProvider {
    const method = paymentMethod || (metadata?.payment_method as string) || (metadata?.payment_provider as string);
    if (method === 'paystack') return 'paystack';
    return 'moolre';
}

export function getVerifyEndpoint(order: {
    payment_method?: string | null;
    metadata?: Record<string, unknown> | null;
}): string {
    const provider = resolvePaymentProvider(order.payment_method, order.metadata);
    return PAYMENT_ENDPOINTS[provider].verify;
}

export function getInitiateEndpoint(paymentMethod: string): string {
    const provider = paymentMethod === 'paystack' ? 'paystack' : 'moolre';
    return PAYMENT_ENDPOINTS[provider].initiate;
}
