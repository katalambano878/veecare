import { NextResponse } from 'next/server';
import { clearAffiliateSessionCookie } from '@/lib/reseller/session';

export async function POST() {
  await clearAffiliateSessionCookie();
  return NextResponse.json({ success: true });
}
