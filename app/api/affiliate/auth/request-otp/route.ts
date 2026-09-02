import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { generateOtp, hashOtp, OTP_TTL_MS } from '@/lib/reseller/session';
import { sendAffiliateOtpEmail } from '@/lib/notifications';

export async function POST(req: Request) {
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`aff-otp:${clientId}`, { maxRequests: 8, windowSeconds: 3600 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many sign-in attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter the email on your affiliate account.' }, { status: 400 });
  }

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id, name, email, status')
    .eq('email', email)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ success: true });
  }

  const otp = generateOtp();
  const { error } = await supabaseAdmin
    .from('affiliates')
    .update({
      login_otp_hash: hashOtp(email, otp),
      login_otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliate.id);

  if (error) {
    return NextResponse.json({ error: 'Could not start sign-in.' }, { status: 500 });
  }

  await sendAffiliateOtpEmail(affiliate, otp);
  return NextResponse.json({ success: true });
}
