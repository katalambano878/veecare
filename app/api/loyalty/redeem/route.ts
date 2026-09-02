import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { redeemLoyaltyPoints } from '@/lib/loyalty';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await verifyAuth(req);
  const body = await req.json().catch(() => null);
  const points = Number(body?.points);
  const orderId = String(body?.orderId || '');
  const maxDiscount = Number(body?.maxDiscount);
  const email = String(body?.email || auth.user?.email || '');
  if (!orderId || !Number.isFinite(points) || points <= 0) {
    return NextResponse.json({ error: 'points and orderId are required' }, { status: 400 });
  }

  try {
    const result = await redeemLoyaltyPoints({
      email,
      userId: auth.user?.id || null,
      points,
      orderId,
      maxDiscount: Number.isFinite(maxDiscount) ? maxDiscount : 0,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Redeem failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
