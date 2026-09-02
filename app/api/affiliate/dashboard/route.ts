import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAffiliate } from '@/lib/reseller/session';

function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://veecare.shop').replace(/\/+$/, '');
}

export async function GET(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const affiliate = auth.affiliate;
  const [{ data: commissions }, { data: links }, { count: visitCount }, { data: visitKeys }] =
    await Promise.all([
      supabaseAdmin
        .from('affiliate_commissions')
        .select(
          'id, order_id, order_number, order_total, commission_amount, affiliate_amount, selling_amount, base_amount, status, created_at'
        )
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('affiliate_links')
        .select('id, public_token, click_count, status, created_at, products(name, slug)')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseAdmin
        .from('affiliate_visits')
        .select('id', { count: 'exact', head: true })
        .eq('affiliate_id', affiliate.id),
      supabaseAdmin
        .from('affiliate_visits')
        .select('visitor_key')
        .eq('affiliate_id', affiliate.id)
        .limit(500),
    ]);

  type CommissionRow = {
    id: string;
    status: string;
    affiliate_amount?: number | null;
    commission_amount: number;
    selling_amount?: number | null;
    order_total: number;
    base_amount?: number | null;
  };
  type LinkRow = { click_count?: number };
  const rows = (commissions || []) as CommissionRow[];
  const pending = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.affiliate_amount ?? r.commission_amount), 0);
  const approved = rows.filter((r) => r.status === 'approved').reduce((s, r) => s + Number(r.affiliate_amount ?? r.commission_amount), 0);
  const paid = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + Number(r.affiliate_amount ?? r.commission_amount), 0);
  const customerRevenue = rows
    .filter((r) => r.status !== 'cancelled')
    .reduce((s, r) => s + Number(r.selling_amount ?? r.order_total), 0);
  const baseRevenue = rows
    .filter((r) => r.status !== 'cancelled')
    .reduce((s, r) => s + Number(r.base_amount || 0), 0);
  const paidOrders = rows.filter((r) => r.status !== 'cancelled').length;
  const uniqueVisitors = new Set((visitKeys || []).map((row: { visitor_key?: string }) => row.visitor_key).filter(Boolean)).size;
  const clicks = ((links || []) as LinkRow[]).reduce((s, l) => s + Number(l.click_count || 0), 0) || visitCount || 0;

  return NextResponse.json({
    affiliate: {
      ...affiliate,
      referralLink: `${siteUrl()}/?ref=${affiliate.code}`,
      pendingBalance: Number(affiliate.total_earned) - Number(affiliate.total_paid),
    },
    metrics: {
      totalClicks: clicks,
      uniqueVisitors: uniqueVisitors || 0,
      ordersGenerated: Number(affiliate.total_orders) || paidOrders,
      paidOrders,
      conversionRate: clicks > 0 ? Math.round((paidOrders / clicks) * 1000) / 10 : 0,
      customerRevenue,
      baseRevenue,
      affiliateEarnings: Number(affiliate.total_earned) || 0,
      pendingEarnings: pending,
      approvedEarnings: approved,
      paidEarnings: paid,
      availableBalance: pending + approved,
    },
    commissions: rows,
    links: links || [],
  });
}

/** @deprecated Use GET with the affiliate session cookie. Kept to avoid breaking old clients. */
export async function POST() {
  return NextResponse.json(
    { error: 'Sign in with the email code sent to your affiliate email. Referral codes are not passwords.' },
    { status: 401 }
  );
}
