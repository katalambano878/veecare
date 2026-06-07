import { isHubtelConfigured } from './hubtel';

export type PaymentMethodId = 'moolre' | 'hubtel';

export interface PaymentMethodOption {
    id: PaymentMethodId;
    label: string;
    description: string;
    icon: string;
    available: boolean;
}

export function isMoolreConfigured(): boolean {
    return !!(
        process.env.MOOLRE_API_USER &&
        process.env.MOOLRE_API_PUBKEY &&
        process.env.MOOLRE_ACCOUNT_NUMBER
    );
}

export function getAvailablePaymentMethods(): PaymentMethodOption[] {
    const methods: PaymentMethodOption[] = [
        {
            id: 'moolre',
            label: 'Mobile Money (Moolre)',
            description: 'Pay with MTN MoMo, Vodafone Cash, or AirtelTigo Money',
            icon: 'ri-smartphone-line',
            available: isMoolreConfigured(),
        },
        {
            id: 'hubtel',
            label: 'Card Payment',
            description: 'Pay with debit/credit card via Hubtel',
            icon: 'ri-bank-card-line',
            available: isHubtelConfigured(),
        },
    ];

    return methods.filter((m) => m.available);
}

export function getDefaultPaymentMethod(): PaymentMethodId | null {
    const available = getAvailablePaymentMethods();
    if (available.length === 0) return null;
    const moolre = available.find((m) => m.id === 'moolre');
    return moolre?.id || available[0].id;
}
