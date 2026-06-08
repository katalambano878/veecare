-- After removing the public SELECT policy on orders (migration
-- 20260608120000), guest checkout broke with:
--   "new row violates row-level security policy for table order_items"
--
-- Cause: the order_items INSERT policy's WITH CHECK ran an EXISTS subquery
-- against orders. That subquery is subject to orders' SELECT RLS, so once
-- guests could no longer read orders, the check always failed.
--
-- Fix: move the ownership check into a SECURITY DEFINER function so it bypasses
-- the read restriction while preserving the SAME ownership rule (the item must
-- belong to a guest order or to the caller's own order).
CREATE OR REPLACE FUNCTION public.can_insert_order_item(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND (o.user_id = auth.uid() OR o.user_id IS NULL)
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_insert_order_item(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
CREATE POLICY "Enable insert for order items" ON public.order_items
  FOR INSERT TO public
  WITH CHECK (public.can_insert_order_item(order_id));
