import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type PaymentEventInput = {
  gateway: 'moolre' | 'paystack' | string;
  eventType?: string;
  externalEventId?: string | null;
  orderNumber?: string | null;
  reference?: string | null;
  payload?: unknown;
  signatureStatus?: string | null;
  processingStatus?: 'received' | 'processed' | 'ignored' | 'failed';
  errorMessage?: string | null;
};

function payloadHash(payload: unknown): string | null {
  if (payload == null) return null;
  try {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return createHash('sha256').update(raw).digest('hex').slice(0, 64);
  } catch {
    return null;
  }
}

/** Persist a gateway callback/verify event for idempotency + audit (best-effort). */
export async function recordPaymentEvent(input: PaymentEventInput): Promise<void> {
  try {
    const row = {
      gateway: input.gateway,
      event_type: input.eventType || 'callback',
      external_event_id: input.externalEventId || null,
      order_number: input.orderNumber || null,
      reference: input.reference || null,
      payload_hash: payloadHash(input.payload),
      signature_status: input.signatureStatus || null,
      processing_status: input.processingStatus || 'received',
      error_message: input.errorMessage ? String(input.errorMessage).slice(0, 500) : null,
      processed_at:
        input.processingStatus === 'processed' || input.processingStatus === 'ignored'
          ? new Date().toISOString()
          : null,
    };

    const { error } = await supabaseAdmin.from('payment_events').insert(row);
    if (error) {
      // Unique (gateway, external_event_id) → duplicate callback; treat as ignored
      const msg = error.message || '';
      if (/duplicate|unique/i.test(msg) && input.externalEventId) {
        console.log(
          '[PaymentEvent] Duplicate ignored:',
          input.gateway,
          input.externalEventId
        );
        return;
      }
      console.error('[PaymentEvent] Insert failed:', msg);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'payment_event_failed';
    console.error('[PaymentEvent] Exception:', message);
  }
}
