import { supabaseAdmin } from '@/lib/supabase-admin';

export const AFFILIATE_COOKIE = 'veecare_affiliate';
export const AFFILIATE_COOKIE_DAYS = 30;
export const DEFAULT_COMMISSION_RATE = 10;

export function normalizeAffiliateCode(code: string): string {
    return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function getAffiliateCodeFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${AFFILIATE_COOKIE}=([^;]*)`));
    if (!match) return null;
    const code = normalizeAffiliateCode(decodeURIComponent(match[1]));
    return code || null;
}

export function setAffiliateCookie(code: string) {
    if (typeof document === 'undefined') return;
    const normalized = normalizeAffiliateCode(code);
    if (!normalized) return;
    const maxAge = AFFILIATE_COOKIE_DAYS * 24 * 60 * 60;
    document.cookie = `${AFFILIATE_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function buildAffiliateLink(code: string, baseUrl?: string): string {
    const site = (baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://veecare.shop').replace(/\/+$/, '');
    return `${site}/?ref=${normalizeAffiliateCode(code)}`;
}

export async function creditAffiliateCommission(orderId: string) {
    if (!orderId) return;
    try {
        const { data, error } = await supabaseAdmin.rpc('credit_affiliate_commission', {
            p_order_id: orderId,
        });
        if (error) {
            console.error('[Affiliate] RPC error:', error.message);
            return;
        }
        if (data?.credited) {
            console.log('[Affiliate] Commission credited for order', orderId, '| amount:', data.commission_amount);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown affiliate error';
        console.error('[Affiliate] Commission credit failed:', message);
    }
}
