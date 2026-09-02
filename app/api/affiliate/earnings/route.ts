import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAffiliate } from '@/lib/reseller/session';
import { getResellerSettings } from '@/lib/reseller/settings';

export async function GET(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const settings = await getResellerSettings();
  const { data } = await supabaseAdmin
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_id', auth.affiliate.id)
    .order('created_at', { ascending: false });

  type EarningRow = {
    id: string;
    status: string;
    affiliate_amount?: number | null;
    commission_amount: number;
    order_number: string;
    created_at: string;
    base_amount?: number | null;
    selling_amount?: number | null;
    order_total: number;
    rate_snapshot?: number | null;
    commission_rate: number;
    updated_at?: string | null;
    paid_at?: string | null;
    reversed_at?: string | null;
  };
  const rows = (data || []) as EarningRow[];
  const sum = (status: string) =>
    rows
      .filter((r) => r.status === status)
      .reduce((s, r) => s + Number(r.affiliate_amount ?? r.commission_amount), 0);

  return NextResponse.json({
    summary: {
      pending: sum('pending'),
      approved: sum('approved'),
      paid: sum('paid'),
      reversed: sum('cancelled'),
      totalEarned: Number(auth.affiliate.total_earned) || 0,
      availableBalance: sum('pending') + sum('approved'),
      minimumPayoutGhs: settings.minimumPayoutGhs,
    },
    earnings: rows.map((row) => ({
      id: row.id,
      order_number: row.order_number,
      created_at: row.created_at,
      status: row.status,
      product_base_amount: Number(row.base_amount || 0),
      selling_amount: Number(row.selling_amount ?? row.order_total),
      affiliate_amount: Number(row.affiliate_amount ?? row.commission_amount),
      rate_snapshot: Number(row.rate_snapshot ?? row.commission_rate),
      approved_at: row.updated_at && row.status !== 'pending' ? row.updated_at : null,
      paid_at: row.paid_at,
      reversed_at: row.reversed_at,
    })),
  });
}
