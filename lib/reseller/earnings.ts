import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { writeAffiliateAudit } from './audit';

type CreditResult =
  | { credited: true; commission_amount: number; affiliate_id: string }
  | { credited: false; reason: string };

export async function creditAffiliateEarning(orderId: string): Promise<CreditResult> {
  if (!orderId) return { credited: false, reason: 'missing_order' };

  const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order || order.payment_status !== 'paid') {
    return { credited: false, reason: 'order_not_paid' };
  }

  const { data: existing } = await supabaseAdmin
    .from('affiliate_commissions')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();
  if (existing) return { credited: false, reason: 'already_credited' };

  const meta = (order.metadata && typeof order.metadata === 'object' ? order.metadata : {}) as Record<
    string,
    unknown
  >;
  const reseller = meta.reseller && typeof meta.reseller === 'object' ? (meta.reseller as Record<string, unknown>) : null;
  const affiliateId = String(reseller?.affiliate_id || meta.affiliate_id || '');
  if (!affiliateId) return { credited: false, reason: 'no_affiliate' };

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id, status, commission_rate, email')
    .eq('id', affiliateId)
    .maybeSingle();
  if (!affiliate || affiliate.status !== 'active') {
    return { credited: false, reason: 'affiliate_inactive' };
  }

  let baseAmount: number;
  let sellingAmount: number;
  let affiliateAmount: number;
  let rateSnapshot: number;

  if (reseller) {
    baseAmount = Number(reseller.subtotal_base_amount) || 0;
    sellingAmount = Number(reseller.customer_subtotal ?? reseller.final_total ?? order.total) || 0;
    affiliateAmount = Number(reseller.affiliate_markup_total) || 0;
    rateSnapshot = Number(reseller.affiliate_rate_snapshot ?? affiliate.commission_rate) || 0;
  } else {
    rateSnapshot = Number(meta.affiliate_commission_rate ?? affiliate.commission_rate) || 0;
    sellingAmount = Number(order.total) || 0;
    affiliateAmount = Math.round(((sellingAmount * rateSnapshot) / 100) * 100) / 100;
    baseAmount = Math.max(0, Math.round((sellingAmount - affiliateAmount) * 100) / 100);
  }

  if (affiliateAmount <= 0) return { credited: false, reason: 'zero_commission' };

  const { error } = await supabaseAdmin.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    order_id: order.id,
    order_number: order.order_number,
    order_total: order.total,
    commission_rate: rateSnapshot,
    commission_amount: affiliateAmount,
    base_amount: baseAmount,
    selling_amount: sellingAmount,
    affiliate_amount: affiliateAmount,
    rate_snapshot: rateSnapshot,
    status: 'pending',
  });

  if (error) {
    if (error.message?.includes('affiliate_commissions_order_id_key') || error.code === '23505') {
      return { credited: false, reason: 'already_credited' };
    }
    console.error('[Affiliate] earning insert failed', error.message);
    return { credited: false, reason: 'insert_failed' };
  }

  const { data: stats } = await supabaseAdmin
    .from('affiliates')
    .select('total_orders, total_earned')
    .eq('id', affiliate.id)
    .maybeSingle();

  await supabaseAdmin
    .from('affiliates')
    .update({
      total_orders: Number(stats?.total_orders || 0) + 1,
      total_earned: Number(stats?.total_earned || 0) + affiliateAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliate.id);

  await writeAffiliateAudit({
    actorType: 'system',
    action: 'earning_created',
    targetType: 'order',
    targetId: order.id,
    meta: { affiliate_id: affiliate.id, affiliate_amount: affiliateAmount, order_number: order.order_number },
  });

  return { credited: true, commission_amount: affiliateAmount, affiliate_id: affiliate.id };
}

export async function reverseAffiliateEarning(orderId: string, actorId?: string): Promise<{ reversed: boolean; reason?: string }> {
  const { data: earning } = await supabaseAdmin
    .from('affiliate_commissions')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (!earning) return { reversed: false, reason: 'no_earning' };
  if (earning.status === 'cancelled') return { reversed: false, reason: 'already_reversed' };

  const amount = Number(earning.affiliate_amount ?? earning.commission_amount) || 0;
  const wasPaid = earning.status === 'paid';

  const { error } = await supabaseAdmin
    .from('affiliate_commissions')
    .update({
      status: 'cancelled',
      reversed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', earning.id)
    .neq('status', 'cancelled');
  if (error) return { reversed: false, reason: error.message };

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('total_earned, total_paid')
    .eq('id', earning.affiliate_id)
    .maybeSingle();

  await supabaseAdmin
    .from('affiliates')
    .update({
      total_earned: Math.max(0, Number(affiliate?.total_earned || 0) - amount),
      total_paid: wasPaid ? Math.max(0, Number(affiliate?.total_paid || 0) - amount) : Number(affiliate?.total_paid || 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', earning.affiliate_id);

  await writeAffiliateAudit({
    actorType: actorId ? 'admin' : 'system',
    actorId,
    action: wasPaid ? 'earning_reversed_after_payout' : 'earning_reversed',
    targetType: 'affiliate_commission',
    targetId: earning.id,
    meta: { order_id: orderId, amount, recovery_required: wasPaid },
  });

  return { reversed: true };
}
