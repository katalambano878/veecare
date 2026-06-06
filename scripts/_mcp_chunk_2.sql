-- 3. HELPER FUNCTIONS (needed before tables for RLS policies)
-- ============================================================================

-- Check if current user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  );
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handle new auth user -> create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update product rating stats from reviews
CREATE OR REPLACE FUNCTION public.update_product_rating_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE products
  SET rating_avg = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND status = 'approved'
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND status = 'approved'
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Upsert customer from order (deduplication logic)
CREATE OR REPLACE FUNCTION public.upsert_customer_from_order(
  p_email text,
  p_phone text,
  p_full_name text,
  p_first_name text,
  p_last_name text,
  p_user_id uuid DEFAULT NULL,
  p_address jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id UUID;
  v_existing_email TEXT;
  v_existing_phone TEXT;
  v_existing_secondary_email TEXT;
  v_existing_secondary_phone TEXT;
BEGIN
  -- Try to find existing customer by email first (check both primary and secondary)
  SELECT id, email, phone, secondary_email, secondary_phone 
  INTO v_customer_id, v_existing_email, v_existing_phone, v_existing_secondary_email, v_existing_secondary_phone 
  FROM customers 
  WHERE email = p_email OR secondary_email = p_email 
  LIMIT 1;
  
  -- If not found by email, try to find by phone number (check both primary and secondary)
  IF v_customer_id IS NULL AND p_phone IS NOT NULL AND p_phone != '' THEN
    SELECT id, email, phone, secondary_email, secondary_phone 
    INTO v_customer_id, v_existing_email, v_existing_phone, v_existing_secondary_email, v_existing_secondary_phone 
    FROM customers 
    WHERE phone = p_phone OR secondary_phone = p_phone 
    LIMIT 1;
  END IF;
  
  IF v_customer_id IS NULL THEN
    -- Create new customer only if no match found
    INSERT INTO customers (email, phone, full_name, first_name, last_name, user_id, default_address)
    VALUES (p_email, p_phone, p_full_name, p_first_name, p_last_name, p_user_id, p_address)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update existing customer with latest info
    UPDATE customers SET
      secondary_email = CASE 
        WHEN p_email IS NOT NULL 
             AND p_email != '' 
             AND p_email != v_existing_email 
             AND (v_existing_secondary_email IS NULL OR v_existing_secondary_email = '' OR v_existing_secondary_email != p_email)
        THEN p_email
        ELSE secondary_email
      END,
      secondary_phone = CASE 
        WHEN p_phone IS NOT NULL 
             AND p_phone != '' 
             AND p_phone != v_existing_phone 
             AND (v_existing_secondary_phone IS NULL OR v_existing_secondary_phone = '' OR v_existing_secondary_phone != p_phone)
        THEN p_phone
        ELSE secondary_phone
      END,
      full_name = COALESCE(NULLIF(p_full_name, ''), full_name),
      first_name = COALESCE(NULLIF(p_first_name, ''), first_name),
      last_name = COALESCE(NULLIF(p_last_name, ''), last_name),
      user_id = COALESCE(p_user_id, user_id),
      default_address = COALESCE(p_address, default_address),
      updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;
  
  RETURN v_customer_id;
END;
$$;

-- Update customer order stats
CREATE OR REPLACE FUNCTION public.update_customer_stats(p_customer_email text, p_order_total numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE customers
  SET total_orders = total_orders + 1,
      total_spent = total_spent + p_order_total,
      last_order_at = NOW(),
      updated_at = NOW()
  WHERE email = p_customer_email;
END;
$$;

-- Reduce stock on order (standalone function)
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reduce main product stock
  UPDATE products p
  SET quantity = GREATEST(p.quantity - oi.quantity, 0),
      updated_at = now()
  FROM order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id;

  -- Reduce variant stock
  UPDATE product_variants pv
  SET quantity = GREATEST(pv.quantity - oi.quantity, 0),
      updated_at = now()
  FROM order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = pv.product_id
    AND oi.variant_name IS NOT NULL
    AND oi.variant_name = pv.name;
END;
$$;

-- Get all customer emails (primary + secondary)
CREATE OR REPLACE FUNCTION public.get_all_customer_emails()
RETURNS TABLE(email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT e.email
  FROM (
    SELECT c.email FROM customers c WHERE c.email IS NOT NULL AND c.email != ''
    UNION
    SELECT c.secondary_email FROM customers c WHERE c.secondary_email IS NOT NULL AND c.secondary_email != ''
  ) e
  ORDER BY e.email;
END;
$$;

-- Get all customer phones (primary + secondary)
CREATE OR REPLACE FUNCTION public.get_all_customer_phones()
RETURNS TABLE(phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.phone
  FROM (
    SELECT c.phone FROM customers c WHERE c.phone IS NOT NULL AND c.phone != ''
    UNION
    SELECT c.secondary_phone FROM customers c WHERE c.secondary_phone IS NOT NULL AND c.secondary_phone != ''
  ) p
  ORDER BY p.phone;
END;
$$;

-- Mark order as paid + reduce stock (must be after orders/order_items/products/product_variants exist)
CREATE OR REPLACE FUNCTION public.mark_order_paid(order_ref text, moolre_ref text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_order orders;
BEGIN
  -- 1. Update the order to paid
  UPDATE orders
  SET 
    payment_status = 'paid',
    status = CASE 
        WHEN status = 'pending' THEN 'processing'::order_status
        WHEN status = 'awaiting_payment' THEN 'processing'::order_status
        ELSE status
    END,
    metadata = COALESCE(metadata, '{}'::jsonb) || 
               jsonb_build_object(
                   'moolre_reference', moolre_ref,
                   'payment_verified_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
               )
  WHERE order_number = order_ref
  RETURNING * INTO updated_order;

  -- 2. Reduce stock (only if we found the order and haven't reduced yet)
  IF updated_order.id IS NOT NULL THEN
      IF (updated_order.metadata->>'stock_reduced') IS NULL THEN
          
          -- Reduce main product stock
          UPDATE products p
          SET quantity = GREATEST(0, p.quantity - oi.quantity)
          FROM order_items oi
          WHERE oi.order_id = updated_order.id
            AND oi.product_id = p.id;

          -- Reduce variant stock (match by product_id + variant_name)
          UPDATE product_variants pv
          SET quantity = GREATEST(0, pv.quantity - oi.quantity)
          FROM order_items oi
          WHERE oi.order_id = updated_order.id
            AND oi.product_id = pv.product_id
            AND oi.variant_name IS NOT NULL
            AND oi.variant_name = pv.name;
            
          -- Flag as reduced
          UPDATE orders 
          SET metadata = metadata || '{"stock_reduced": true}'::jsonb
          WHERE id = updated_order.id;
          
      END IF;
  ELSE
      -- Fallback search
      SELECT * INTO updated_order FROM orders WHERE order_number = order_ref;
  END IF;

  RETURN to_jsonb(updated_order);
END;
$$;
-- ============================================================================