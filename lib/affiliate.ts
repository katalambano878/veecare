import { creditAffiliateEarning } from '@/lib/reseller/earnings';

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
    const data = await creditAffiliateEarning(orderId);
    if (data.credited) {
      console.log(
        '[Affiliate] Earning credited for order',
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
