-- Store-wide sale helpers: apply a percentage discount to all products + variants,
-- or restore original prices from compare_at_price.

CREATE OR REPLACE FUNCTION public.apply_store_wide_discount(p_percent numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product_count int := 0;
  v_variant_count int := 0;
BEGIN
  IF p_percent <= 0 OR p_percent >= 100 THEN
    RAISE EXCEPTION 'Discount must be between 1 and 99 percent';
  END IF;

  IF NOT (auth.role() = 'service_role' OR public.is_admin_or_staff()) THEN
    RAISE EXCEPTION 'Not authorized to apply store-wide discount';
  END IF;

  UPDATE public.products SET
    compare_at_price = COALESCE(compare_at_price, price),
    price = ROUND(COALESCE(compare_at_price, price) * (1 - p_percent / 100.0), 2),
    updated_at = now();

  GET DIAGNOSTICS v_product_count = ROW_COUNT;

  UPDATE public.product_variants SET
    compare_at_price = COALESCE(compare_at_price, price),
    price = ROUND(COALESCE(compare_at_price, price) * (1 - p_percent / 100.0), 2),
    updated_at = now();

  GET DIAGNOSTICS v_variant_count = ROW_COUNT;

  INSERT INTO public.store_settings (key, value, description, updated_at)
  VALUES (
    'store_wide_sale',
    jsonb_build_object('active', true, 'percent', p_percent, 'applied_at', now()),
    'Active store-wide sale percentage',
    now()
  )
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

  RETURN jsonb_build_object(
    'products_updated', v_product_count,
    'variants_updated', v_variant_count,
    'percent', p_percent
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_store_wide_discount()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product_count int := 0;
  v_variant_count int := 0;
BEGIN
  IF NOT (auth.role() = 'service_role' OR public.is_admin_or_staff()) THEN
    RAISE EXCEPTION 'Not authorized to clear store-wide discount';
  END IF;

  UPDATE public.products SET
    price = COALESCE(compare_at_price, price),
    compare_at_price = NULL,
    updated_at = now()
  WHERE compare_at_price IS NOT NULL;

  GET DIAGNOSTICS v_product_count = ROW_COUNT;

  UPDATE public.product_variants SET
    price = COALESCE(compare_at_price, price),
    compare_at_price = NULL,
    updated_at = now()
  WHERE compare_at_price IS NOT NULL;

  GET DIAGNOSTICS v_variant_count = ROW_COUNT;

  DELETE FROM public.store_settings WHERE key = 'store_wide_sale';

  RETURN jsonb_build_object(
    'products_restored', v_product_count,
    'variants_restored', v_variant_count
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.apply_store_wide_discount(numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.clear_store_wide_discount() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_store_wide_discount(numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.clear_store_wide_discount() TO authenticated, service_role;
