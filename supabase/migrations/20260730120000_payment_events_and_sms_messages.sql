-- Idempotency / audit tables for payments and SMS (plain Postgres cutover)

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  gateway text NOT NULL,
  event_type text NOT NULL DEFAULT 'callback',
  external_event_id text,
  order_number text,
  reference text,
  payload_hash text,
  signature_status text,
  processing_status text NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (gateway, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order_number
  ON public.payment_events (order_number, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_reference
  ON public.payment_events (reference);

CREATE TABLE IF NOT EXISTS public.sms_messages (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  provider text NOT NULL DEFAULT 'moolre',
  recipient_masked text NOT NULL,
  message_type text NOT NULL DEFAULT 'generic',
  related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  provider_message_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_order
  ON public.sms_messages (related_order_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sms_messages_order_type_sent
  ON public.sms_messages (related_order_id, message_type)
  WHERE related_order_id IS NOT NULL AND status = 'sent' AND message_type = 'order_confirmation';
