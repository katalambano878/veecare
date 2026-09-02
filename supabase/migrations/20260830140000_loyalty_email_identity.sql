-- Loyalty follows checkout email so guest buyers earn and redeem points.

ALTER TABLE public.loyalty_accounts
  ADD COLUMN IF NOT EXISTS email text;

UPDATE public.loyalty_accounts a
SET email = lower(trim(p.email))
FROM public.profiles p
WHERE (a.email IS NULL OR btrim(a.email) = '')
  AND p.id = a.user_id
  AND p.email IS NOT NULL
  AND btrim(p.email) <> '';

DELETE FROM public.loyalty_accounts
WHERE email IS NULL OR btrim(email) = '';

UPDATE public.loyalty_accounts
SET email = lower(trim(email))
WHERE email IS NOT NULL;

ALTER TABLE public.loyalty_accounts
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.loyalty_accounts
  DROP CONSTRAINT IF EXISTS loyalty_accounts_pkey;

ALTER TABLE public.loyalty_accounts
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.loyalty_accounts
  DROP CONSTRAINT IF EXISTS loyalty_accounts_user_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'loyalty_accounts_pkey'
  ) THEN
    ALTER TABLE public.loyalty_accounts
      ADD CONSTRAINT loyalty_accounts_pkey PRIMARY KEY (email);
  END IF;
END $$;

ALTER TABLE public.loyalty_accounts
  ADD CONSTRAINT loyalty_accounts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_accounts_user_id_uidx
  ON public.loyalty_accounts (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.loyalty_ledger
  ADD COLUMN IF NOT EXISTS email text;

UPDATE public.loyalty_ledger l
SET email = lower(trim(p.email))
FROM public.profiles p
WHERE (l.email IS NULL OR btrim(l.email) = '')
  AND p.id = l.user_id
  AND p.email IS NOT NULL;

UPDATE public.loyalty_ledger l
SET email = a.email
FROM public.loyalty_accounts a
WHERE (l.email IS NULL OR btrim(l.email) = '')
  AND l.user_id IS NOT NULL
  AND a.user_id = l.user_id;

DELETE FROM public.loyalty_ledger
WHERE email IS NULL OR btrim(email) = '';

UPDATE public.loyalty_ledger
SET email = lower(trim(email))
WHERE email IS NOT NULL;

ALTER TABLE public.loyalty_ledger
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.loyalty_ledger
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.loyalty_ledger
  DROP CONSTRAINT IF EXISTS loyalty_ledger_user_id_fkey;

ALTER TABLE public.loyalty_ledger
  ADD CONSTRAINT loyalty_ledger_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS loyalty_ledger_email_created_idx
  ON public.loyalty_ledger (email, created_at DESC);

-- Credit already-paid orders (guest and logged-in) that have no earn row yet.
WITH settings AS (
  SELECT COALESCE(NULLIF((value->>'earnGhsPerPoint')::numeric, 0), 10) AS earn
  FROM public.store_settings
  WHERE key = 'loyalty_program'
  UNION ALL
  SELECT 10
  LIMIT 1
),
paid AS (
  SELECT
    o.id,
    o.order_number,
    o.user_id,
    lower(trim(o.email)) AS email,
    FLOOR(o.total / (SELECT earn FROM settings))::int AS pts
  FROM public.orders o
  WHERE o.payment_status = 'paid'
    AND o.email IS NOT NULL
    AND btrim(o.email) <> ''
    AND lower(o.email) NOT LIKE 'pos-walkin%'
    AND o.total > 0
)
INSERT INTO public.loyalty_ledger (user_id, email, order_id, entry_type, points, note)
SELECT p.user_id, p.email, p.id, 'earn', p.pts, 'Earned from ' || COALESCE(p.order_number, 'order')
FROM paid p
WHERE p.pts > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.loyalty_ledger l
    WHERE l.order_id = p.id AND l.entry_type = 'earn'
  );

INSERT INTO public.loyalty_accounts (email, user_id, points, lifetime_points, updated_at)
SELECT
  l.email,
  (ARRAY_AGG(l.user_id) FILTER (WHERE l.user_id IS NOT NULL))[1],
  GREATEST(SUM(l.points), 0)::int,
  GREATEST(SUM(CASE WHEN l.points > 0 THEN l.points ELSE 0 END), 0)::int,
  now()
FROM public.loyalty_ledger l
GROUP BY l.email
ON CONFLICT (email) DO UPDATE SET
  user_id = COALESCE(public.loyalty_accounts.user_id, EXCLUDED.user_id),
  points = EXCLUDED.points,
  lifetime_points = EXCLUDED.lifetime_points,
  updated_at = now();

INSERT INTO public.schema_migrations (version, name)
VALUES ('20260830140000', 'loyalty_email_identity')
ON CONFLICT (version) DO NOTHING;
