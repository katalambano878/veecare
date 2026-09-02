import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAffiliate } from '@/lib/reseller/session';
import { writeAffiliateAudit } from '@/lib/reseller/audit';

export async function PATCH(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const name = String(body?.name || '').trim();
  const phone = String(body?.phone || '').trim();
  const payout_method = String(body?.payout_method || '').trim();
  const payout_network = String(body?.payout_network || '').trim();
  const payout_account = String(body?.payout_account || '').trim();

  if (name && name.length < 2) {
    return NextResponse.json({ error: 'Name is too short' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('affiliates')
    .update({
      ...(name ? { name } : {}),
      phone: phone || null,
      payout_method: payout_method || null,
      payout_network: payout_network || null,
      payout_account: payout_account || null,
      payout_details: {
        network: payout_network || null,
        account: payout_account || null,
        method: payout_method || null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.affiliate.id);

  if (error) return NextResponse.json({ error: 'Could not update profile' }, { status: 500 });

  await writeAffiliateAudit({
    actorType: 'affiliate',
    actorId: auth.affiliate.id,
    action: 'profile_updated',
    targetType: 'affiliate',
    targetId: auth.affiliate.id,
  });

  return NextResponse.json({ success: true });
}
