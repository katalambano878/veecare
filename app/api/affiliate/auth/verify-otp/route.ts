import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { hashOtp, setAffiliateSessionCookie, signAffiliateSession } from '@/lib/reseller/session';

export async function POST(req: Request) {
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`aff-otp-verify:${clientId}`, { maxRequests: 15, windowSeconds: 3600 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const otp = String(body?.otp || '').replace(/\D/g, '');
  if (!email || otp.length !== 6) {
    return NextResponse.json({ error: 'Enter your email and the 6-digit code.' }, { status: 400 });
  }

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id, email, login_otp_hash, login_otp_expires_at, status')
    .eq('email', email)
    .maybeSingle();

  if (!affiliate?.login_otp_hash || !affiliate.login_otp_expires_at) {
    return NextResponse.json({ error: 'Request a new sign-in code.' }, { status: 400 });
  }
  if (new Date(affiliate.login_otp_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'That code expired. Request a new one.' }, { status: 400 });
  }
  if (affiliate.login_otp_hash !== hashOtp(email, otp)) {
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 401 });
  }

  await supabaseAdmin
    .from('affiliates')
    .update({ login_otp_hash: null, login_otp_expires_at: null, updated_at: new Date().toISOString() })
    .eq('id', affiliate.id);

  const token = await signAffiliateSession({ affiliateId: affiliate.id, email: affiliate.email });
  await setAffiliateSessionCookie(token);

  return NextResponse.json({ success: true, status: affiliate.status });
}
