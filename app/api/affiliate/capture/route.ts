import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { captureAffiliateByCode, captureAffiliateByLinkToken } from '@/lib/reseller/attribution';
import { visitorKey } from '@/lib/reseller/tokens';
import { normalizeAffiliateCode } from '@/lib/affiliate-client';

export async function POST(req: Request) {
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`aff-capture:${clientId}`, { maxRequests: 60, windowSeconds: 60 });
  if (!rateLimit.success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const code = body?.code ? normalizeAffiliateCode(String(body.code)) : '';
  const token = String(body?.token || '').trim().toUpperCase();

  const captured = token
    ? await captureAffiliateByLinkToken(token)
    : code
      ? { attribution: await captureAffiliateByCode(code), productSlug: null }
      : null;

  const attribution = captured && 'attribution' in captured ? captured.attribution : captured;
  if (!attribution) {
    return NextResponse.json({ ok: false, attributed: false });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const ua = req.headers.get('user-agent') || '';
  await supabaseAdmin.from('affiliate_visits').insert({
    affiliate_id: attribution.affiliateId,
    link_id: attribution.linkId,
    visitor_key: visitorKey(ip, ua),
  });

  return NextResponse.json({
    ok: true,
    attributed: true,
    code: attribution.affiliateCode,
    productSlug: captured && 'productSlug' in captured ? captured.productSlug : null,
  });
}
