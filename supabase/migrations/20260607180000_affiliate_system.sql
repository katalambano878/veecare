-- Affiliate / referral program

CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  payout_method text,
  payout_details jsonb DEFAULT '{}'::jsonb,
  notes text,
  total_orders integer NOT NULL DEFAULT 0,
  total_earned numeric(12,2) NOT NULL DEFAULT 0,
  total_paid numeric(12,2) NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates (upper(code));
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates (lower(email));
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates (status);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  order_total numeric(12,2) NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON public.affiliate_commissions (affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions (status);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage affiliates" ON public.affiliates
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "Staff manage affiliate commissions" ON public.affiliate_commissions
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

-- Credit commission once when an order is paid (idempotent)
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
  v_affiliate_id uuid;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.payment_status IS DISTINCT FROM 'paid' THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'order_not_paid');
  END IF;

  IF EXISTS (SELECT 1 FROM affiliate_commissions WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'already_credited');
  END IF;

  v_affiliate_id := NULLIF(v_order.metadata->>'affiliate_id', '')::uuid;
  IF v_affiliate_id IS NULL THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'no_affiliate');
  END IF;

  SELECT * INTO v_affiliate FROM affiliates WHERE id = v_affiliate_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'affiliate_inactive');
  END IF;

  v_commission := round(v_order.total * v_affiliate.commission_rate / 100, 2);
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
    status
  ) VALUES (
    v_affiliate.id,
    v_order.id,
    v_order.order_number,
    v_order.total,
    v_affiliate.commission_rate,
    v_commission,
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

-- Safe public lookup for checkout attribution (no email exposed)
CREATE OR REPLACE FUNCTION public.resolve_affiliate_code(p_code text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'code', code,
    'commission_rate', commission_rate
  )
  FROM affiliates
  WHERE upper(code) = upper(trim(p_code)) AND status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_affiliate_code(text) TO anon, authenticated;

-- Lock down commission crediting to server-side (service_role) only.
-- Postgres grants EXECUTE to PUBLIC by default, so revoke that first.
REVOKE EXECUTE ON FUNCTION public.credit_affiliate_commission(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_affiliate_commission(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.credit_affiliate_commission(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_affiliate_commission(uuid) TO service_role;
