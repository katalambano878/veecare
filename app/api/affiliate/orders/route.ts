import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAffiliate } from '@/lib/reseller/session';

export async function GET(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data } = await supabaseAdmin
    .from('affiliate_commissions')
    .select(
      'id, order_id, order_number, order_total, commission_amount, affiliate_amount, selling_amount, base_amount, rate_snapshot, status, created_at'
    )
    .eq('affiliate_id', auth.affiliate.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({
    orders: ((data || []) as Array<{
      id: string;
      order_id: string;
      order_number: string;
      created_at: string;
      status: string;
      base_amount?: number | null;
      selling_amount?: number | null;
      order_total: number;
      affiliate_amount?: number | null;
      commission_amount: number;
      rate_snapshot?: number | null;
    }>).map((row) => ({
      id: row.id,
      order_id: row.order_id,
      order_number: row.order_number,
      created_at: row.created_at,
      payment_status: row.status === 'cancelled' ? 'reversed' : 'paid',
      earning_status: row.status,
      product_base_amount: Number(row.base_amount || 0),
      selling_amount: Number(row.selling_amount ?? row.order_total),
      affiliate_amount: Number(row.affiliate_amount ?? row.commission_amount),
      rate_snapshot: Number(row.rate_snapshot || 0),
    })),
  });
}
