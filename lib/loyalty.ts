import { supabaseAdmin } from '@/lib/supabase-admin';
import { isStoreModuleEnabled } from '@/lib/store-modules';
import {
  DEFAULT_LOYALTY_SETTINGS,
  quoteEarnPoints,
  quoteRedeemDiscount,
  type LoyaltySettings,
} from '@/lib/loyalty-math';

export {
  DEFAULT_LOYALTY_SETTINGS,
  quoteEarnPoints,
  quoteRedeemDiscount,
  type LoyaltySettings,
} from '@/lib/loyalty-math';

export type LoyaltyAccount = {
  email: string;
  user_id: string | null;
  points: number;
  lifetime_points: number;
  updated_at: string | null;
};

export type LoyaltyLedgerRow = {
  id: string;
  email: string;
  user_id: string | null;
  order_id: string | null;
  entry_type: 'earn' | 'redeem' | 'adjust';
  points: number;
  note: string | null;
  created_at: string;
};

const SKIP_EMAILS = /^(pos-walkin@|noreply@|no-reply@)/i;

export function normalizeLoyaltyEmail(raw: string | null | undefined): string | null {
  const email = String(raw || '').trim().toLowerCase();
  if (!email || !email.includes('@') || SKIP_EMAILS.test(email)) return null;
  return email;
}

function emptyAccount(email: string): LoyaltyAccount {
  return { email, user_id: null, points: 0, lifetime_points: 0, updated_at: null };
}

function asSettings(raw: unknown): LoyaltySettings {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const earnGhsPerPoint = Number(value.earnGhsPerPoint);
  const redeemPoints = Number(value.redeemPoints);
  const redeemValueGhs = Number(value.redeemValueGhs);
  const minRedeemPoints = Number(value.minRedeemPoints);
  return {
    earnGhsPerPoint: earnGhsPerPoint > 0 ? earnGhsPerPoint : DEFAULT_LOYALTY_SETTINGS.earnGhsPerPoint,
    redeemPoints: redeemPoints > 0 ? redeemPoints : DEFAULT_LOYALTY_SETTINGS.redeemPoints,
    redeemValueGhs: redeemValueGhs > 0 ? redeemValueGhs : DEFAULT_LOYALTY_SETTINGS.redeemValueGhs,
    minRedeemPoints: minRedeemPoints > 0 ? minRedeemPoints : DEFAULT_LOYALTY_SETTINGS.minRedeemPoints,
  };
}

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const { data } = await supabaseAdmin
    .from('store_settings')
    .select('value')
    .eq('key', 'loyalty_program')
    .maybeSingle();
  return asSettings(data?.value);
}

export async function saveLoyaltySettings(settings: LoyaltySettings): Promise<void> {
  const payload = {
    earnGhsPerPoint: Math.max(1, Number(settings.earnGhsPerPoint) || 10),
    redeemPoints: Math.max(1, Number(settings.redeemPoints) || 100),
    redeemValueGhs: Math.max(0.01, Number(settings.redeemValueGhs) || 10),
    minRedeemPoints: Math.max(1, Number(settings.minRedeemPoints) || 100),
  };
  const { error } = await supabaseAdmin.from('store_settings').upsert(
    {
      key: 'loyalty_program',
      value: payload,
      description: 'Loyalty earn/redeem rules',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
  if (error) throw error;
}

export async function getLoyaltyAccountByEmail(emailRaw: string): Promise<LoyaltyAccount> {
  const email = normalizeLoyaltyEmail(emailRaw);
  if (!email) return emptyAccount('');
  const { data } = await supabaseAdmin
    .from('loyalty_accounts')
    .select('email, user_id, points, lifetime_points, updated_at')
    .eq('email', email)
    .maybeSingle();
  if (!data) return emptyAccount(email);
  return {
    email,
    user_id: data.user_id || null,
    points: Number(data.points || 0),
    lifetime_points: Number(data.lifetime_points || 0),
    updated_at: data.updated_at ?? null,
  };
}

export async function getLoyaltyAccount(userId: string): Promise<LoyaltyAccount> {
  const { data: byUser } = await supabaseAdmin
    .from('loyalty_accounts')
    .select('email, user_id, points, lifetime_points, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (byUser?.email) {
    return {
      email: byUser.email,
      user_id: byUser.user_id || userId,
      points: Number(byUser.points || 0),
      lifetime_points: Number(byUser.lifetime_points || 0),
      updated_at: byUser.updated_at ?? null,
    };
  }
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();
  return getLoyaltyAccountByEmail(String(profile?.email || ''));
}

async function ensureAccount(email: string, userId?: string | null): Promise<void> {
  const { data } = await supabaseAdmin
    .from('loyalty_accounts')
    .select('email, user_id')
    .eq('email', email)
    .maybeSingle();
  if (!data) {
    const { error } = await supabaseAdmin.from('loyalty_accounts').insert({
      email,
      user_id: userId || null,
      points: 0,
      lifetime_points: 0,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }
  if (userId && !data.user_id) {
    await supabaseAdmin
      .from('loyalty_accounts')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('email', email);
  }
}

async function applyDelta(
  email: string,
  delta: number,
  lifetimeDelta: number,
  entry: {
    entry_type: LoyaltyLedgerRow['entry_type'];
    points: number;
    order_id?: string | null;
    note?: string | null;
    user_id?: string | null;
  }
): Promise<LoyaltyAccount> {
  await ensureAccount(email, entry.user_id);
  const current = await getLoyaltyAccountByEmail(email);
  const nextPoints = current.points + delta;
  if (nextPoints < 0) {
    throw new Error('Not enough loyalty points');
  }

  const { error: updateError } = await supabaseAdmin
    .from('loyalty_accounts')
    .update({
      points: nextPoints,
      lifetime_points: current.lifetime_points + lifetimeDelta,
      user_id: current.user_id || entry.user_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('email', email);
  if (updateError) throw updateError;

  const { error: ledgerError } = await supabaseAdmin.from('loyalty_ledger').insert({
    email,
    user_id: current.user_id || entry.user_id || null,
    order_id: entry.order_id || null,
    entry_type: entry.entry_type,
    points: entry.points,
    note: entry.note || null,
  });
  if (ledgerError) throw ledgerError;

  return getLoyaltyAccountByEmail(email);
}

export async function claimLoyaltyForUser(userId: string, emailRaw?: string | null): Promise<LoyaltyAccount | null> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();
    const email = normalizeLoyaltyEmail(emailRaw || profile?.email);
    if (!email) return null;

    const byEmail = await getLoyaltyAccountByEmail(email);
    const { data: byUser } = await supabaseAdmin
      .from('loyalty_accounts')
      .select('email, user_id, points, lifetime_points')
      .eq('user_id', userId)
      .maybeSingle();

    if (byUser?.email && byUser.email !== email) {
      await applyDelta(email, Number(byUser.points || 0), Number(byUser.lifetime_points || 0), {
        entry_type: 'adjust',
        points: Number(byUser.points || 0),
        user_id: userId,
        note: `Merged points from ${byUser.email}`,
      });
      await supabaseAdmin.from('loyalty_accounts').delete().eq('email', byUser.email);
    }

    await ensureAccount(email, userId);
    await supabaseAdmin
      .from('loyalty_accounts')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('email', email);
    await supabaseAdmin
      .from('loyalty_ledger')
      .update({ user_id: userId })
      .eq('email', email)
      .is('user_id', null);

    return getLoyaltyAccountByEmail(email);
  } catch (error) {
    console.error('[loyalty] claim failed:', error);
    return null;
  }
}

export async function awardLoyaltyForPaidOrder(order: {
  id?: string | null;
  user_id?: string | null;
  email?: string | null;
  total?: number | string | null;
  order_number?: string | null;
}): Promise<{ awarded: number; skipped?: string } | null> {
  try {
    if (!(await isStoreModuleEnabled('loyalty-program'))) {
      return { awarded: 0, skipped: 'disabled' };
    }
    if (!order?.id) return { awarded: 0, skipped: 'no_order' };

    const { data: existing } = await supabaseAdmin
      .from('loyalty_ledger')
      .select('id, points')
      .eq('order_id', order.id)
      .eq('entry_type', 'earn')
      .maybeSingle();
    if (existing) {
      return { awarded: Number(existing.points || 0), skipped: 'already_awarded' };
    }

    const email = normalizeLoyaltyEmail(order.email);
    if (!email) return { awarded: 0, skipped: 'no_email' };

    const settings = await getLoyaltySettings();
    const points = quoteEarnPoints(Number(order.total || 0), settings);
    if (points <= 0) return { awarded: 0, skipped: 'below_threshold' };

    await applyDelta(email, points, points, {
      entry_type: 'earn',
      points,
      order_id: order.id,
      user_id: order.user_id || null,
      note: `Earned from ${order.order_number || 'order'}`,
    });
    return { awarded: points };
  } catch (error) {
    console.error('[loyalty] award failed:', error);
    return null;
  }
}

export async function redeemLoyaltyPoints(opts: {
  email: string;
  userId?: string | null;
  points: number;
  orderId: string;
  maxDiscount: number;
}): Promise<{ pointsUsed: number; discount: number }> {
  if (!(await isStoreModuleEnabled('loyalty-program'))) {
    throw new Error('Loyalty program is disabled');
  }
  const email = normalizeLoyaltyEmail(opts.email);
  if (!email) throw new Error('A valid email is required to redeem points');

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, email')
    .eq('id', opts.orderId)
    .maybeSingle();
  if (!order) throw new Error('Order not found');
  if (normalizeLoyaltyEmail(order.email) !== email) {
    throw new Error('Loyalty points can only be used on an order with the same email');
  }

  const settings = await getLoyaltySettings();
  const requested = Math.floor(Number(opts.points) || 0);
  if (requested < settings.minRedeemPoints) {
    throw new Error(`Minimum ${settings.minRedeemPoints} points required to redeem`);
  }
  const account = await getLoyaltyAccountByEmail(email);
  const usable = Math.min(requested, account.points);
  let discount = quoteRedeemDiscount(usable, settings);
  discount = Math.min(discount, Number(opts.maxDiscount) || 0);
  const blocks = Math.floor(discount / settings.redeemValueGhs);
  const pointsUsed = blocks * settings.redeemPoints;
  if (pointsUsed <= 0 || discount <= 0) {
    throw new Error('Not enough points for a reward');
  }

  const { data: existing } = await supabaseAdmin
    .from('loyalty_ledger')
    .select('id')
    .eq('order_id', opts.orderId)
    .eq('entry_type', 'redeem')
    .maybeSingle();
  if (existing) {
    throw new Error('Points already redeemed on this order');
  }

  await applyDelta(email, -pointsUsed, 0, {
    entry_type: 'redeem',
    points: -pointsUsed,
    order_id: opts.orderId,
    user_id: opts.userId || account.user_id,
    note: `Redeemed GH₵ ${discount.toFixed(2)}`,
  });

  return { pointsUsed, discount: Number(discount.toFixed(2)) };
}

export async function adjustLoyaltyPoints(opts: {
  email?: string;
  userId?: string;
  points: number;
  note?: string;
}): Promise<LoyaltyAccount> {
  const delta = Math.trunc(Number(opts.points));
  if (!delta) throw new Error('Adjustment cannot be zero');
  let email = normalizeLoyaltyEmail(opts.email);
  let userId = opts.userId || null;
  if (!email && userId) {
    const account = await getLoyaltyAccount(userId);
    email = normalizeLoyaltyEmail(account.email);
  }
  if (!email) throw new Error('Customer email is required');
  return applyDelta(email, delta, delta > 0 ? delta : 0, {
    entry_type: 'adjust',
    points: delta,
    user_id: userId,
    note: opts.note || 'Admin adjustment',
  });
}

export async function listLoyaltyAccounts(): Promise<
  Array<LoyaltyAccount & { full_name: string | null }>
> {
  const { data: accounts, error } = await supabaseAdmin
    .from('loyalty_accounts')
    .select('email, user_id, points, lifetime_points, updated_at')
    .order('points', { ascending: false })
    .limit(200);
  if (error) throw error;

  const rows = (accounts || []) as LoyaltyAccount[];
  const emails = rows.map((a) => a.email).filter(Boolean);
  const ids = rows.map((a) => a.user_id).filter((id): id is string => Boolean(id));

  const profileRows: { id: string; email: string | null; full_name: string | null }[] = [];
  if (ids.length) {
    const { data } = await supabaseAdmin.from('profiles').select('id, email, full_name').in('id', ids);
    profileRows.push(...((data || []) as typeof profileRows));
  }
  if (emails.length) {
    const { data } = await supabaseAdmin.from('profiles').select('id, email, full_name').in('email', emails);
    profileRows.push(...((data || []) as typeof profileRows));
  }

  const byId = new Map<string, string>();
  const byEmail = new Map<string, string>();
  for (const p of profileRows) {
    if (p.full_name && p.id) byId.set(p.id, p.full_name);
    if (p.full_name && p.email) byEmail.set(String(p.email).toLowerCase(), p.full_name);
  }

  const { data: customers } = emails.length
    ? await supabaseAdmin.from('customers').select('email, full_name').in('email', emails)
    : { data: [] as { email: string | null; full_name: string | null }[] };
  const customerNames = new Map(
    ((customers || []) as { email: string | null; full_name: string | null }[])
      .filter((c) => c.email && c.full_name)
      .map((c) => [String(c.email).toLowerCase(), c.full_name as string])
  );

  return rows.map((a) => ({
    ...a,
    points: Number(a.points || 0),
    lifetime_points: Number(a.lifetime_points || 0),
    full_name:
      (a.user_id ? byId.get(a.user_id) : null) ||
      byEmail.get(a.email) ||
      customerNames.get(a.email) ||
      null,
  }));
}

export async function listLoyaltyLedger(emailOrUserId: string, limit = 25): Promise<LoyaltyLedgerRow[]> {
  const email = normalizeLoyaltyEmail(emailOrUserId);
  let query = supabaseAdmin
    .from('loyalty_ledger')
    .select('id, email, user_id, order_id, entry_type, points, note, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  query = email ? query.eq('email', email) : query.eq('user_id', emailOrUserId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as LoyaltyLedgerRow[];
}
