-- C2: Stop guest orders/items from being world-readable via the anon key.
-- Previously these policies allowed anyone with the public key to read every
-- guest order (e.g. GET /rest/v1/orders?user_id=is.null), exposing names,
-- addresses, phones and emails.
--
-- Guest order reads now go through server routes that use the service role and
-- enforce identity:
--   * /api/orders/lookup    (order tracking — requires matching email)
--   * /api/orders/status    (order-success — non-PII confirmation only)
--   * /api/orders/pay-info  (complete-payment page — private link)
--
-- Logged-in customers keep "Users view own orders/items"; staff keep full
-- access via "Staff manage ...". Guest checkout still works because order
-- creation only needs the INSERT policy (the client now generates the order id
-- and no longer reads the row back).
DROP POLICY IF EXISTS "Enable select for guest orders" ON public.orders;
DROP POLICY IF EXISTS "Enable select for guest order items" ON public.order_items;
