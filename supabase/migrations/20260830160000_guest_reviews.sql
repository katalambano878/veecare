-- Allow guest (no-account) product reviews. Still pending until admin approval.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS guest_name text;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS guest_email text;

CREATE INDEX IF NOT EXISTS idx_reviews_guest_email
  ON public.reviews (guest_email)
  WHERE guest_email IS NOT NULL;

INSERT INTO public.schema_migrations (version, name)
VALUES ('20260830160000', 'guest_reviews')
ON CONFLICT (version) DO NOTHING;
