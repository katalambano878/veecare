-- Reseller / markup affiliate engine. Existing affiliates and commissions are preserved.

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS login_otp_hash text,
  ADD COLUMN IF NOT EXISTS login_otp_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_network text,
  ADD COLUMN IF NOT EXISTS payout_account text;

ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS base_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS selling_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS affiliate_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS rate_snapshot numeric(8,2),
  ADD COLUMN IF NOT EXISTS reversed_at timestamptz;

UPDATE public.affiliate_commissions
SET
  affiliate_amount = COALESCE(affiliate_amount, commission_amount),
  selling_amount = COALESCE(selling_amount, order_total),
  base_amount = COALESCE(base_amount, GREATEST(0, order_total - commission_amount)),
  rate_snapshot = COALESCE(rate_snapshot, commission_rate)
WHERE affiliate_amount IS NULL OR selling_amount IS NULL OR base_amount IS NULL;

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  public_token text NOT NULL UNIQUE,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  markup_type text NOT NULL DEFAULT 'percentage',
  markup_rate_snapshot numeric(8,2),
  fixed_markup_snapshot numeric(12,2),
  custom_selling_price_snapshot numeric(12,2),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate ON public.affiliate_links (affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_token ON public.affiliate_links (public_token);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_product ON public.affiliate_links (product_id);

CREATE TABLE IF NOT EXISTS public.affiliate_visits (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  visitor_key text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_visits_affiliate ON public.affiliate_visits (affiliate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.affiliate_audit_log (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  actor_type text NOT NULL,
  actor_id text,
  action text NOT NULL,
  target_type text,
  target_id text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_audit_created ON public.affiliate_audit_log (created_at DESC);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage affiliate links" ON public.affiliate_links;
CREATE POLICY "Staff manage affiliate links" ON public.affiliate_links
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff manage affiliate visits" ON public.affiliate_visits;
CREATE POLICY "Staff manage affiliate visits" ON public.affiliate_visits
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff manage affiliate audit" ON public.affiliate_audit_log;
CREATE POLICY "Staff manage affiliate audit" ON public.affiliate_audit_log
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE OR REPLACE FUNCTION public.increment_affiliate_link_clicks(p_link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.affiliate_links
  SET click_count = click_count + 1, updated_at = now()
  WHERE id = p_link_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_affiliate_link_clicks(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_affiliate_link_clicks(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.credit_affiliate_commission(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order orders;
  v_affiliate affiliates;
  v_commission numeric(12,2);
  v_base numeric(12,2);
  v_selling numeric(12,2);
  v_rate numeric(8,2);
  v_affiliate_id uuid;
  v_reseller jsonb;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.payment_status IS DISTINCT FROM 'paid' THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'order_not_paid');
  END IF;

  IF EXISTS (SELECT 1 FROM affiliate_commissions WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'already_credited');
  END IF;

  v_reseller := v_order.metadata->'reseller';
  v_affiliate_id := NULLIF(COALESCE(v_reseller->>'affiliate_id', v_order.metadata->>'affiliate_id'), '')::uuid;
  IF v_affiliate_id IS NULL THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'no_affiliate');
  END IF;

  SELECT * INTO v_affiliate FROM affiliates WHERE id = v_affiliate_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'affiliate_inactive');
  END IF;

  IF v_reseller IS NOT NULL AND COALESCE((v_reseller->>'affiliate_markup_total')::numeric, 0) > 0 THEN
    v_commission := round((v_reseller->>'affiliate_markup_total')::numeric, 2);
    v_base := round(COALESCE((v_reseller->>'subtotal_base_amount')::numeric, 0), 2);
    v_selling := round(COALESCE((v_reseller->>'customer_subtotal')::numeric, v_order.total), 2);
    v_rate := round(COALESCE((v_reseller->>'affiliate_rate_snapshot')::numeric, v_affiliate.commission_rate), 2);
  ELSE
    v_rate := v_affiliate.commission_rate;
    v_commission := round(v_order.total * v_rate / 100, 2);
    v_selling := v_order.total;
    v_base := greatest(0, round(v_selling - v_commission, 2));
  END IF;

  IF v_commission <= 0 THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'zero_commission');
  END IF;

  INSERT INTO affiliate_commissions (
    affiliate_id,
    order_id,
    order_number,
    order_total,
    commission_rate,
    commission_amount,
    base_amount,
    selling_amount,
    affiliate_amount,
    rate_snapshot,
    status
  ) VALUES (
    v_affiliate.id,
    v_order.id,
    v_order.order_number,
    v_order.total,
    v_rate,
    v_commission,
    v_base,
    v_selling,
    v_commission,
    v_rate,
    'pending'
  );

  UPDATE affiliates
  SET
    total_orders = total_orders + 1,
    total_earned = total_earned + v_commission,
    updated_at = now()
  WHERE id = v_affiliate.id;

  RETURN jsonb_build_object(
    'credited', true,
    'affiliate_id', v_affiliate.id,
    'commission_amount', v_commission
  );
END;
$$;
