-- Live shoppers, End of Day report, and Profit margins (supplier costs).
-- Ported from the standardecom / mkgadgets admin tools. Idempotent: safe to re-run.

-- What each product cost from the supplier. Falls back to products.cost_per_item
-- when a row is missing. Only admins read or write this.
CREATE TABLE IF NOT EXISTS public.product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_name text,
  cost_price numeric(12,2) NOT NULL CHECK (cost_price >= 0),
  notes text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row per browser tab that pinged recently. Upserted every 30s by the storefront.
CREATE TABLE IF NOT EXISTS public.live_sessions (
  visitor_id text PRIMARY KEY,
  page text NOT NULL,
  stage text NOT NULL,
  cart_items integer NOT NULL DEFAULT 0,
  cart_value numeric(12,2) NOT NULL DEFAULT 0,
  last_seen timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_sessions_last_seen_idx ON public.live_sessions (last_seen DESC);

-- One row per visitor per Accra calendar day, for the "visitors today" count.
CREATE TABLE IF NOT EXISTS public.site_visits (
  id bigserial PRIMARY KEY,
  visitor_id text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visits_day_idx ON public.site_visits (visited_at, visitor_id);

-- These tables are only touched by server routes (service role / pool). Lock them
-- away from anon + authenticated REST callers the same way the affiliate tables are.
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage product costs" ON public.product_costs;
CREATE POLICY "Staff manage product costs" ON public.product_costs
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff read live sessions" ON public.live_sessions;
CREATE POLICY "Staff read live sessions" ON public.live_sessions
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff read site visits" ON public.site_visits;
CREATE POLICY "Staff read site visits" ON public.site_visits
  FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

-- The app's Postgres role (plain-PG deployment). Default privileges cover tables
-- created by postgres, but sequences need an explicit grant.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'store_veecare') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_costs, public.live_sessions, public.site_visits TO store_veecare;
    GRANT USAGE, SELECT ON SEQUENCE public.site_visits_id_seq TO store_veecare;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_costs, public.live_sessions, public.site_visits TO service_role;
    GRANT USAGE, SELECT ON SEQUENCE public.site_visits_id_seq TO service_role;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version text PRIMARY KEY,
  name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (version, name) VALUES
  ('20260902120000', 'affiliate_reseller_engine'),
  ('20261021120000', 'live_shoppers_eod_profit')
ON CONFLICT (version) DO NOTHING;
