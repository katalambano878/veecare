import { supabaseAdmin } from '@/lib/supabase-admin';

function maskRecipient(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `${digits.slice(0, 3)}****${digits.slice(-2)}`;
}

export type RecordSmsInput = {
  recipient: string;
  messageType?: string;
  relatedOrderId?: string | null;
  providerMessageId?: string | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  failureReason?: string | null;
  attempts?: number;
};

/** Persist SMS attempt for audit / duplicate visibility (best-effort, no PII body). */
export async function recordSmsMessage(input: RecordSmsInput): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('sms_messages').insert({
      provider: 'moolre',
      recipient_masked: maskRecipient(input.recipient),
      message_type: input.messageType || 'generic',
      related_order_id: input.relatedOrderId || null,
      provider_message_id: input.providerMessageId || null,
      status: input.status,
      attempts: input.attempts ?? 1,
      failure_reason: input.failureReason ? String(input.failureReason).slice(0, 500) : null,
      sent_at: input.status === 'sent' ? new Date().toISOString() : null,
    });
    if (error) {
      console.error('[SMS Record] Insert failed:', error.message);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'sms_record_failed';
    console.error('[SMS Record] Exception:', message);
  }
}
