/** Shared coupon types and discount calculation (used by API routes + storefront). */

export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface ValidatedCoupon {
    id: string;
    code: string;
    type: CouponType;
    value: number;
    description?: string;
    minimum_purchase: number;
    maximum_discount?: number;
}

export interface CouponValidationResult {
    valid: boolean;
    coupon?: ValidatedCoupon;
    discountAmount?: number;
    reason?: string;
}

export function normalizeCouponType(raw: string | null | undefined): CouponType {
    if (raw === 'fixed_amount' || raw === 'fixed') return 'fixed_amount';
    if (raw === 'free_shipping') return 'free_shipping';
    return 'percentage';
}

export function calculateCouponDiscount(
    coupon: Pick<ValidatedCoupon, 'type' | 'value' | 'maximum_discount'>,
    subtotal: number,
    shippingCost = 0
): number {
    if (subtotal <= 0) return 0;

    if (coupon.type === 'free_shipping') {
        return Math.max(0, shippingCost);
    }

    if (coupon.type === 'fixed_amount') {
        return Math.min(coupon.value, subtotal);
    }

    let discount = subtotal * (coupon.value / 100);
    if (coupon.maximum_discount != null && coupon.maximum_discount > 0) {
        discount = Math.min(discount, coupon.maximum_discount);
    }
    return Math.round(discount * 100) / 100;
}

export function validateCouponRecord(
    data: Record<string, unknown>,
    subtotal: number,
    shippingCost = 0
): CouponValidationResult {
    const code = String(data.code || '').toUpperCase();
    const isActive = data.is_active !== false;
    const now = new Date();
    const start = data.start_date ? new Date(String(data.start_date)) : null;
    const end = data.end_date ? new Date(String(data.end_date)) : null;
    const usageLimit = data.usage_limit != null ? Number(data.usage_limit) : null;
    const usageCount = Number(data.usage_count ?? 0);
    const minPurchase = Number(data.minimum_purchase ?? 0) || 0;

    if (!isActive) return { valid: false, reason: 'This coupon is no longer active.' };
    if (start && start > now) return { valid: false, reason: 'This coupon is not yet valid.' };
    if (end && end < now) return { valid: false, reason: 'This coupon has expired.' };
    if (usageLimit != null && usageCount >= usageLimit) {
        return { valid: false, reason: 'This coupon has reached its usage limit.' };
    }
    if (minPurchase > 0 && subtotal < minPurchase) {
        return {
            valid: false,
            reason: `Minimum purchase of GH₵${minPurchase.toFixed(2)} required.`,
        };
    }

    const coupon: ValidatedCoupon = {
        id: String(data.id),
        code,
        type: normalizeCouponType(data.type as string),
        value: Number(data.value ?? 0),
        description: data.description ? String(data.description) : undefined,
        minimum_purchase: minPurchase,
        maximum_discount:
            data.maximum_discount != null ? Number(data.maximum_discount) : undefined,
    };

    const discountAmount = calculateCouponDiscount(coupon, subtotal, shippingCost);

    return { valid: true, coupon, discountAmount };
}

export const APPLIED_COUPON_STORAGE_KEY = 'veecare_applied_coupon';

export interface StoredAppliedCoupon extends ValidatedCoupon {
    discountAmount: number;
}
