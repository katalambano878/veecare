import { NextResponse } from 'next/server';
import { getAvailablePaymentMethods } from '@/lib/payments/availability';

/** Returns which payment gateways are configured (no secrets exposed). */
export async function GET() {
    const methods = getAvailablePaymentMethods().map(({ id, label, description, icon }) => ({
        id,
        label,
        description,
        icon,
    }));

    return NextResponse.json({
        methods,
        defaultMethod: methods.find((m) => m.id === 'moolre')?.id || methods[0]?.id || null,
    });
}
