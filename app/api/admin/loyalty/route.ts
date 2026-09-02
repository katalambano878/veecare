import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import {
  adjustLoyaltyPoints,
  DEFAULT_LOYALTY_SETTINGS,
  getLoyaltySettings,
  listLoyaltyAccounts,
  listLoyaltyLedger,
  saveLoyaltySettings,
  type LoyaltySettings,
} from '@/lib/loyalty';
import { isStoreModuleEnabled } from '@/lib/store-modules';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await verifyAuth(req, { requireAdmin: true });
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const accountKey = url.searchParams.get('email') || url.searchParams.get('userId');

  const [enabled, settings, accounts] = await Promise.all([
    isStoreModuleEnabled('loyalty-program'),
    getLoyaltySettings(),
    listLoyaltyAccounts(),
  ]);

  const ledger = accountKey ? await listLoyaltyLedger(accountKey, 40) : [];

  return NextResponse.json({ enabled, settings, accounts, ledger });
}

export async function POST(req: Request) {
  const auth = await verifyAuth(req, { requireAdmin: true });
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = String(body?.action || '');

  try {
    if (action === 'save-settings') {
      const incoming = body?.settings || {};
      const settings: LoyaltySettings = {
        earnGhsPerPoint: Number(incoming.earnGhsPerPoint) || DEFAULT_LOYALTY_SETTINGS.earnGhsPerPoint,
        redeemPoints: Number(incoming.redeemPoints) || DEFAULT_LOYALTY_SETTINGS.redeemPoints,
        redeemValueGhs: Number(incoming.redeemValueGhs) || DEFAULT_LOYALTY_SETTINGS.redeemValueGhs,
        minRedeemPoints: Number(incoming.minRedeemPoints) || DEFAULT_LOYALTY_SETTINGS.minRedeemPoints,
      };
      await saveLoyaltySettings(settings);
      return NextResponse.json({ success: true, settings });
    }

    if (action === 'set-enabled') {
      const enabled = Boolean(body?.enabled);
      const { error } = await supabaseAdmin.from('store_modules').upsert(
        { id: 'loyalty-program', enabled, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
      if (error) throw error;
      return NextResponse.json({ success: true, enabled });
    }

    if (action === 'adjust') {
      const userId = String(body?.userId || '');
      const email = String(body?.email || '');
      const points = Number(body?.points);
      const note = String(body?.note || 'Admin adjustment');
      if ((!userId && !email) || !Number.isFinite(points) || !points) {
        return NextResponse.json({ error: 'email and non-zero points are required' }, { status: 400 });
      }
      const account = await adjustLoyaltyPoints({ userId, email, points, note });
      return NextResponse.json({ success: true, account });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
