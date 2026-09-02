import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getResellerSettings, saveResellerSettings } from '@/lib/reseller/settings';
import { writeAffiliateAudit } from '@/lib/reseller/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await verifyAuth(req, { requireAdmin: true });
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  return NextResponse.json({ settings: await getResellerSettings() });
}

export async function PATCH(req: Request) {
  const auth = await verifyAuth(req, { requireAdmin: true });
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const settings = await saveResellerSettings(body);
  await writeAffiliateAudit({
    actorType: 'admin',
    actorId: auth.user?.id,
    action: 'reseller_settings_updated',
    targetType: 'store_settings',
    targetId: 'affiliate_reseller',
  });
  return NextResponse.json({ settings });
}
