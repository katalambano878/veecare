import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function writeAffiliateAudit(entry: {
  actorType: 'admin' | 'affiliate' | 'system';
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseAdmin.from('affiliate_audit_log').insert({
      actor_type: entry.actorType,
      actor_id: entry.actorId || null,
      action: entry.action,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      meta: entry.meta || {},
    });
  } catch (err) {
    console.error('[Affiliate audit] write failed', err);
  }
}
