-- Security hardening: restrict sensitive SECURITY DEFINER functions.
-- Postgres grants EXECUTE to PUBLIC by default; revoke that and re-grant narrowly.

-- Customer PII dumps — not called by app code, server-only.
REVOKE EXECUTE ON FUNCTION public.get_all_customer_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_customer_emails() TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_all_customer_phones() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_customer_phones() TO service_role;

-- Stat/stock helpers — only invoked server-side via service role.
REVOKE EXECUTE ON FUNCTION public.update_customer_stats(text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_customer_stats(text, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION public.reduce_stock_on_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reduce_stock_on_order(uuid) TO service_role;

-- mark_order_paid — add an internal authorization guard so only the service
-- role (payment webhooks/verify) or an admin/staff user (POS) can mark orders
-- paid. Anonymous and regular customers are blocked.
CREATE OR REPLACE FUNCTION public.mark_order_paid(order_ref text, moolre_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_order public.orders%ROWTYPE;
BEGIN
  IF NOT (auth.role() = 'service_role' OR public.is_admin_or_staff()) THEN
    RAISE EXCEPTION 'Not authorized to mark orders paid';
  END IF;

  UPDATE orders SET payment_status = 'paid',
    status = CASE WHEN status = 'pending' THEN 'processing'::order_status WHEN status = 'awaiting_payment' THEN 'processing'::order_status ELSE status END,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('moolre_reference', moolre_ref, 'payment_verified_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
  WHERE order_number = order_ref RETURNING * INTO updated_order;
  IF updated_order.id IS NOT NULL THEN
    IF (updated_order.metadata->>'stock_reduced') IS NULL THEN
      UPDATE products p SET quantity = GREATEST(0, p.quantity - oi.quantity) FROM order_items oi WHERE oi.order_id = updated_order.id AND oi.product_id = p.id;
      UPDATE product_variants pv SET quantity = GREATEST(0, pv.quantity - oi.quantity) FROM order_items oi WHERE oi.order_id = updated_order.id AND oi.product_id = pv.product_id AND oi.variant_name IS NOT NULL AND oi.variant_name = pv.name;
      UPDATE orders SET metadata = metadata || '{"stock_reduced": true}'::jsonb WHERE id = updated_order.id;
    END IF;
  ELSE
    SELECT * INTO updated_order FROM orders WHERE order_number = order_ref;
  END IF;
  RETURN to_jsonb(updated_order);
END;
$function$;

-- Block anonymous callers entirely; the internal guard handles authenticated.
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(text, text) TO authenticated, service_role;
