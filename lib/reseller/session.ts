import 'server-only';
import { createHash, randomInt } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const AFFILIATE_SESSION_COOKIE = 'veecare_aff_session';
const OTP_TTL_MS = 10 * 60 * 1000;

export type AffiliateSession = {
  affiliateId: string;
  email: string;
};

function secretKey() {
  const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || '';
  return new TextEncoder().encode(secret || 'veecare-affiliate-dev-secret');
}

export function hashOtp(email: string, otp: string): string {
  return createHash('sha256')
    .update(`${email.trim().toLowerCase()}:${otp}`)
    .digest('hex');
}

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export async function signAffiliateSession(session: AffiliateSession): Promise<string> {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secretKey());
}

export async function readAffiliateSessionToken(token: string | undefined | null): Promise<AffiliateSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const affiliateId = String(payload.affiliateId || '');
    const email = String(payload.email || '');
    if (!affiliateId || !email) return null;
    return { affiliateId, email };
  } catch {
    return null;
  }
}

export async function setAffiliateSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(AFFILIATE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearAffiliateSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(AFFILIATE_SESSION_COOKIE);
}

export async function getAffiliateSessionFromRequest(req: Request): Promise<AffiliateSession | null> {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|; )${AFFILIATE_SESSION_COOKIE}=([^;]*)`));
  const token = match ? decodeURIComponent(match[1]) : null;
  return readAffiliateSessionToken(token);
}

export async function requireAffiliate(req: Request) {
  const session = await getAffiliateSessionFromRequest(req);
  if (!session) return { error: 'Sign in required', status: 401 as const, affiliate: null };
  const { data } = await supabaseAdmin
    .from('affiliates')
    .select(
      'id, code, name, email, phone, status, commission_rate, payout_method, payout_details, payout_network, payout_account, total_orders, total_earned, total_paid, created_at'
    )
    .eq('id', session.affiliateId)
    .eq('email', session.email)
    .maybeSingle();
  if (!data) return { error: 'Affiliate session invalid', status: 401 as const, affiliate: null };
  return { error: null, status: 200 as const, affiliate: data };
}

export { OTP_TTL_MS };
