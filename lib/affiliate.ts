import { supabaseAdmin } from '@/lib/supabase-admin';

export {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_DAYS,
  DEFAULT_COMMISSION_RATE,
  normalizeAffiliateCode,
  isValidAffiliateCode,
  suggestAffiliateCode,
  getAffiliateCodeFromCookie,
  setAffiliateCookie,
  buildAffiliateLink,
} from './affiliate-client';

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
      console.log(
        '[Affiliate] Commission credited for order',
        orderId,
        '| amount:',
        data.commission_amount
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown affiliate error';
    console.error('[Affiliate] Commission credit failed:', message);
  }
}
