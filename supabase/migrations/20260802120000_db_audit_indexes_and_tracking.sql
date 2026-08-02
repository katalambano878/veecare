-- Database audit corrective migration (2026-08-02)
-- - schema_migrations tracking (was missing after Supabase cutover)
-- - hot-path FK / filter indexes identified in live audit
-- - composite order lookup for admin + payment reconciliation
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version text PRIMARY KEY,
  name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, name) VALUES
  ('20260209000000', 'complete_schema'),
  ('20260218000000', 'allow_null_order_items_product_fks'),
  ('20260219000000', 'contact_submissions'),
  ('20260528180000', 'ai_chat_memory_and_kb'),
  ('20260607180000', 'affiliate_system'),
  ('20260608113000', 'harden_sensitive_rpcs'),
  ('20260608120000', 'remove_public_guest_order_select'),
  ('20260608131000', 'fix_order_items_insert_after_rls_lockdown'),
  ('20260610120000', 'store_sale_and_coupon_redeem'),
  ('20260730120000', 'payment_events_and_sms_messages'),
  ('20260802120000', 'db_audit_indexes_and_tracking')
ON CONFLICT (version) DO NOTHING;

-- Hot-path FK indexes (missing on live store_veecare)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items (variant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items (product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON public.return_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages (ticket_id);

-- Admin / payment reconciliation
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created
  ON public.orders (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email_lower
  ON public.orders (lower(email));

-- Payment / SMS audit helpers
CREATE INDEX IF NOT EXISTS idx_payment_events_processing
  ON public.payment_events (processing_status, received_at DESC)
  WHERE processing_status IN ('received', 'failed');
CREATE INDEX IF NOT EXISTS idx_sms_messages_status_created
  ON public.sms_messages (status, created_at DESC);

-- Financial sanity (skip if conflicting legacy rows exist — wrap safely)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_total_non_negative'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_total_non_negative CHECK (total >= 0);
  END IF;
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'orders_total_non_negative skipped — existing rows violate CHECK';
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_quantity_positive'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);
  END IF;
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'order_items_quantity_positive skipped — existing rows violate CHECK';
END $$;
