import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeAffiliateCode } from '@/lib/affiliate-client';
import { getResellerSettings } from './settings';

export const ATTR_COOKIE = 'veecare_aff_attr';

export type AttributionPayload = {
  affiliateId: string;
  affiliateCode: string;
  linkId: string | null;
  capturedAt: number;
  exp: number;
};

function secretKey() {
  const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || '';
  return new TextEncoder().encode(secret || 'veecare-affiliate-dev-secret');
}

export async function signAttribution(payload: Omit<AttributionPayload, 'exp'>, days: number): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  return new SignJWT({ ...payload, exp })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .sign(secretKey());
}

export async function readAttributionToken(token: string | undefined | null): Promise<AttributionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const affiliateId = String(payload.affiliateId || '');
    const affiliateCode = String(payload.affiliateCode || '');
    if (!affiliateId || !affiliateCode) return null;
    return {
      affiliateId,
      affiliateCode,
      linkId: payload.linkId ? String(payload.linkId) : null,
      capturedAt: Number(payload.capturedAt) || 0,
      exp: Number(payload.exp) || 0,
    };
  } catch {
    return null;
  }
}

export async function getActiveAttributionFromRequest(req: Request): Promise<AttributionPayload | null> {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|; )${ATTR_COOKIE}=([^;]*)`));
  const token = match ? decodeURIComponent(match[1]) : null;
  const signed = await readAttributionToken(token);
  if (signed && signed.exp * 1000 > Date.now()) return signed;
  return null;
}

export async function setAttributionCookie(value: string, days: number): Promise<void> {
  const jar = await cookies();
  jar.set(ATTR_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: days * 24 * 60 * 60,
  });
}

export async function captureAffiliateByCode(codeRaw: string): Promise<AttributionPayload | null> {
  const code = normalizeAffiliateCode(codeRaw);
  if (!code) return null;
  const { data } = await supabaseAdmin
    .from('affiliates')
    .select('id, code, status')
    .eq('code', code)
    .maybeSingle();
  if (!data || data.status !== 'active') return null;
  const settings = await getResellerSettings();
  const payload = {
    affiliateId: data.id,
    affiliateCode: data.code,
    linkId: null,
    capturedAt: Date.now(),
  };
  const token = await signAttribution(payload, settings.attributionWindowDays);
  await setAttributionCookie(token, settings.attributionWindowDays);
  return { ...payload, exp: Math.floor(Date.now() / 1000) + settings.attributionWindowDays * 86400 };
}

export async function captureAffiliateByLinkToken(publicToken: string): Promise<{
  attribution: AttributionPayload;
  productSlug: string;
} | null> {
  const token = publicToken.trim().toUpperCase();
  if (!token) return null;
  const { data: link } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, affiliate_id, product_id, status, click_count, affiliates(id, code, status), products(slug, status)')
    .eq('public_token', token)
    .maybeSingle();
  if (!link || link.status !== 'active') return null;
  const affiliate = Array.isArray(link.affiliates) ? link.affiliates[0] : link.affiliates;
  const product = Array.isArray(link.products) ? link.products[0] : link.products;
  if (!affiliate || affiliate.status !== 'active' || !product?.slug) return null;

  const settings = await getResellerSettings();
  const payload = {
    affiliateId: affiliate.id,
    affiliateCode: affiliate.code,
    linkId: link.id,
    capturedAt: Date.now(),
  };
  const signed = await signAttribution(payload, settings.attributionWindowDays);
  await setAttributionCookie(signed, settings.attributionWindowDays);

  await supabaseAdmin.rpc('increment_affiliate_link_clicks', { p_link_id: link.id }).then(
    () => undefined,
    async () => {
      await supabaseAdmin
        .from('affiliate_links')
        .update({ click_count: (Number(link.click_count) || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', link.id);
    }
  );

  return {
    attribution: {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + settings.attributionWindowDays * 86400,
    },
    productSlug: product.slug,
  };
}

export async function loadActiveAffiliate(affiliateId: string) {
  const { data } = await supabaseAdmin
    .from('affiliates')
    .select('id, code, name, email, phone, status, commission_rate')
    .eq('id', affiliateId)
    .maybeSingle();
  if (!data || data.status !== 'active') return null;
  return data;
}
