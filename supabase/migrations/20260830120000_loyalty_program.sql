-- Loyalty program: customer balances, ledger, default rules.

CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT loyalty_accounts_points_nonneg CHECK (points >= 0),
  CONSTRAINT loyalty_accounts_lifetime_nonneg CHECK (lifetime_points >= 0)
);

CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('earn', 'redeem', 'adjust')),
  points integer NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_ledger_user_created_idx
  ON public.loyalty_ledger (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_ledger_earn_order_uidx
  ON public.loyalty_ledger (order_id)
  WHERE entry_type = 'earn' AND order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_ledger_redeem_order_uidx
  ON public.loyalty_ledger (order_id)
  WHERE entry_type = 'redeem' AND order_id IS NOT NULL;

INSERT INTO public.store_settings (key, value, description, updated_at)
VALUES (
  'loyalty_program',
  '{"earnGhsPerPoint":10,"redeemPoints":100,"redeemValueGhs":10,"minRedeemPoints":100}'::jsonb,
  'Loyalty earn/redeem rules. 1 point per GHS 10 spent; 100 points = GHS 10 off.',
  now()
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_modules (id, enabled, updated_at)
VALUES ('loyalty-program', false, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.schema_migrations (version, name)
VALUES ('20260830120000', 'loyalty_program')
ON CONFLICT (version) DO NOTHING;
