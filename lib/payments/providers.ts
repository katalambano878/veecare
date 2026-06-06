export type PaymentProvider = 'hubtel' | 'moolre';

export const PAYMENT_ENDPOINTS: Record<
    PaymentProvider,
    { initiate: string; verify: string; label: string }
> = {
    hubtel: {
        initiate: '/api/payment/hubtel',
        verify: '/api/payment/hubtel/verify',
        label: 'Hubtel',
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
    if (method === 'moolre') return 'moolre';
    return 'hubtel';
}

export function getVerifyEndpoint(order: {
    payment_method?: string | null;
    metadata?: Record<string, unknown> | null;
}): string {
    const provider = resolvePaymentProvider(order.payment_method, order.metadata);
    return PAYMENT_ENDPOINTS[provider].verify;
}

export function getInitiateEndpoint(paymentMethod: string): string {
    const provider = paymentMethod === 'moolre' ? 'moolre' : 'hubtel';
    return PAYMENT_ENDPOINTS[provider].initiate;
}
