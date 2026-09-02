import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendAffiliateApprovedEmail } from '@/lib/notifications';
import { reverseAffiliateEarning } from '@/lib/reseller/earnings';
import { writeAffiliateAudit } from '@/lib/reseller/audit';

export const dynamic = 'force-dynamic';

type AffiliateRow = {
  id: string;
  name: string;
  email: string;
  code: string;
  status: string;
  commission_rate: number | string | null;
};

async function loadAffiliate(id: string): Promise<AffiliateRow | null> {
  const { data, error } = await supabaseAdmin
    .from('affiliates')
    .select('id, name, email, code, status, commission_rate')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as AffiliateRow;
}

export async function POST(req: Request) {
  const auth = await verifyAuth(req, { requireAdmin: true });
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    action?: string;
    id?: string;
    status?: string;
    orderId?: string;
    linkId?: string;
  } | null;

  const action = String(body?.action || '');

  if (action === 'reverse-order-earning') {
    const orderId = String(body?.orderId || '').trim();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    const result = await reverseAffiliateEarning(orderId, auth.user?.id);
    return NextResponse.json(result);
  }

  if (action === 'disable-link') {
    const linkId = String(body?.linkId || '').trim();
    if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });
    const { error } = await supabaseAdmin
      .from('affiliate_links')
      .update({ status: 'disabled', updated_at: new Date().toISOString() })
      .eq('id', linkId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAffiliateAudit({
      actorType: 'admin',
      actorId: auth.user?.id,
      action: 'link_disabled',
      targetType: 'affiliate_link',
      targetId: linkId,
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'notify-all-active') {
    const { data: rows, error } = await supabaseAdmin
      .from('affiliates')
      .select('id, name, email, code, commission_rate, status')
      .eq('status', 'active');

    if (error) {
      return NextResponse.json({ error: error.message || 'Could not load affiliates' }, { status: 500 });
    }

    const list = (rows || []) as AffiliateRow[];
    let sent = 0;
    let failed = 0;
    for (const affiliate of list) {
      const mail = await sendAffiliateApprovedEmail(affiliate);
      if (mail?.error) failed += 1;
      else sent += 1;
    }

    return NextResponse.json({
      success: failed === 0,
      emailed: sent,
      failed,
      total: list.length,
    });
  }

  const id = String(body?.id || '').trim();
  if (!id) {
    return NextResponse.json({ error: 'Affiliate id is required' }, { status: 400 });
  }

  const existing = await loadAffiliate(id);
  if (!existing) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
  }

  if (action === 'set-status') {
    const status = String(body?.status || '');
    if (status !== 'active' && status !== 'pending' && status !== 'suspended') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (existing.status !== status) {
      const { error } = await supabaseAdmin
        .from('affiliates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 500 });
      }
    }

    let emailSent = false;
    if (status === 'active' && existing.status !== 'active') {
      const mail = await sendAffiliateApprovedEmail(existing);
      emailSent = !mail?.error;
    }

    await writeAffiliateAudit({
      actorType: 'admin',
      actorId: auth.user?.id,
      action: `affiliate_${status}`,
      targetType: 'affiliate',
      targetId: id,
    });

    return NextResponse.json({ success: true, status, emailSent });
  }

  if (action === 'notify-approved') {
    const mail = await sendAffiliateApprovedEmail(existing);
    return NextResponse.json({ success: !mail?.error, emailSent: !mail?.error });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
