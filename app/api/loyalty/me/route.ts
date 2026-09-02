import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import {
  claimLoyaltyForUser,
  getLoyaltyAccount,
  getLoyaltyAccountByEmail,
  getLoyaltySettings,
  listLoyaltyLedger,
  normalizeLoyaltyEmail,
  quoteEarnPoints,
} from '@/lib/loyalty';
import { isStoreModuleEnabled } from '@/lib/store-modules';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const emailParam = normalizeLoyaltyEmail(url.searchParams.get('email'));
  const auth = await verifyAuth(req);

  const enabled = await isStoreModuleEnabled('loyalty-program');
  const settings = await getLoyaltySettings();

  if (auth.authenticated && auth.user?.id) {
    await claimLoyaltyForUser(auth.user.id, auth.user.email);
    const account = await getLoyaltyAccount(auth.user.id);
    const ledger = enabled ? await listLoyaltyLedger(account.email || auth.user.id, 20) : [];
    return NextResponse.json({
      enabled,
      settings,
      account,
      ledger,
      earnPreview: quoteEarnPoints(10, settings),
    });
  }

  if (emailParam) {
    const account = await getLoyaltyAccountByEmail(emailParam);
    return NextResponse.json({
      enabled,
      settings,
      account,
      ledger: [],
      earnPreview: quoteEarnPoints(10, settings),
    });
  }

  return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
}
