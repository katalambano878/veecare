import { NextResponse } from 'next/server';
import { requireAffiliate } from '@/lib/reseller/session';
import { getResellerSettings } from '@/lib/reseller/settings';

export async function GET(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const settings = await getResellerSettings();
  return NextResponse.json({
    affiliate: {
      id: auth.affiliate.id,
      code: auth.affiliate.code,
      name: auth.affiliate.name,
      email: auth.affiliate.email,
      phone: auth.affiliate.phone,
      status: auth.affiliate.status,
      commission_rate: auth.affiliate.commission_rate,
      payout_method: auth.affiliate.payout_method,
      payout_network: auth.affiliate.payout_network,
      payout_account: auth.affiliate.payout_account,
      total_orders: auth.affiliate.total_orders,
      total_earned: auth.affiliate.total_earned,
      total_paid: auth.affiliate.total_paid,
    },
    settings: {
      attributionWindowDays: settings.attributionWindowDays,
      minimumPayoutGhs: settings.minimumPayoutGhs,
    },
  });
}
