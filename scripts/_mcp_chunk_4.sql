-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff view any profile" ON public.profiles FOR SELECT USING (is_admin_or_staff());

-- Addresses
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage all addresses" ON public.addresses FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Store Settings
CREATE POLICY "Staff view settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Staff manage settings" ON public.store_settings FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Audit Logs
CREATE POLICY "Staff view audit logs" ON public.audit_logs FOR SELECT USING (is_admin_or_staff());
CREATE POLICY "Staff insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (is_admin_or_staff());

-- Categories
CREATE POLICY "Public view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Staff manage categories" ON public.categories FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Products
CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (status = 'active'::product_status OR is_admin_or_staff());
CREATE POLICY "Staff manage products" ON public.products FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Product Images
CREATE POLICY "Public view images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Staff manage images" ON public.product_images FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Product Variants
CREATE POLICY "Public view variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Staff manage variants" ON public.product_variants FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Coupons
CREATE POLICY "Allow anon read access to coupons" ON public.coupons FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated read access to coupons" ON public.coupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin insert on coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));
CREATE POLICY "Allow admin update on coupons" ON public.coupons FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));
CREATE POLICY "Allow admin delete on coupons" ON public.coupons FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));

-- Orders
CREATE POLICY "Enable insert for all users" ON public.orders FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)) OR ((auth.uid() IS NULL) AND (user_id IS NULL)));
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable select for guest orders" ON public.orders FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Staff manage all orders" ON public.orders FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Order Items
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Enable select for guest order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id IS NULL));
CREATE POLICY "Enable insert for order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)));
CREATE POLICY "Staff manage order items" ON public.order_items FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Order Status History
CREATE POLICY "Users view order history" ON public.order_status_history FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Staff manage order history" ON public.order_status_history FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Cart Items
CREATE POLICY "Users manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wishlist Items
CREATE POLICY "Users manage own wishlist" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reviews
CREATE POLICY "Public view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved'::review_status);
CREATE POLICY "Users view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff manage reviews" ON public.reviews FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Review Images
CREATE POLICY "Public view review images" ON public.review_images FOR SELECT USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_images.review_id AND reviews.status = 'approved'::review_status));
CREATE POLICY "Users manage review images" ON public.review_images FOR ALL USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_images.review_id AND reviews.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_images.review_id AND reviews.user_id = auth.uid()));

-- Blog Posts
CREATE POLICY "Public view published posts" ON public.blog_posts FOR SELECT USING (status = 'published'::blog_status OR is_admin_or_staff());
CREATE POLICY "Staff manage blog" ON public.blog_posts FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Support Tickets
CREATE POLICY "Users manage own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage tickets" ON public.support_tickets FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Support Messages
CREATE POLICY "Users view ticket messages" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
CREATE POLICY "Users create messages" ON public.support_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
CREATE POLICY "Staff manage messages" ON public.support_messages FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Return Requests
CREATE POLICY "Users view own returns" ON public.return_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create returns" ON public.return_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage returns" ON public.return_requests FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Return Items
CREATE POLICY "Users view return items" ON public.return_items FOR SELECT USING (EXISTS (SELECT 1 FROM return_requests WHERE return_requests.id = return_items.return_request_id AND return_requests.user_id = auth.uid()));
CREATE POLICY "Staff manage return items" ON public.return_items FOR ALL USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

-- Notifications
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pages
CREATE POLICY "Public can view pages" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Staff can manage pages" ON public.pages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));

-- Site Settings
CREATE POLICY "Allow public read on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin write on site_settings" ON public.site_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

-- CMS Content
CREATE POLICY "Allow public read on cms_content" ON public.cms_content FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admin all on cms_content" ON public.cms_content FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

-- Banners
CREATE POLICY "Allow public read on banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admin all on banners" ON public.banners FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

-- Navigation Menus
CREATE POLICY "Allow public read on navigation_menus" ON public.navigation_menus FOR SELECT USING (true);
CREATE POLICY "Allow admin all on navigation_menus" ON public.navigation_menus FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

-- Navigation Items
CREATE POLICY "Allow public read on navigation_items" ON public.navigation_items FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admin all on navigation_items" ON public.navigation_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

-- Store Modules
CREATE POLICY "Allow public read access" ON public.store_modules FOR SELECT USING (true);
CREATE POLICY "Allow admin insert on store_modules" ON public.store_modules FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));
CREATE POLICY "Allow authenticated update" ON public.store_modules FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Customers
CREATE POLICY "Staff can view all customers" ON public.customers FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));
CREATE POLICY "Service role full access to customers" ON public.customers FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 9. STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('blog', 'blog', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('reviews', 'reviews', true);

-- ============================================================================
-- 10. STORAGE POLICIES
-- ============================================================================

-- Products bucket
CREATE POLICY "Public read access for products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin upload access for products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND is_admin_or_staff() = true);
CREATE POLICY "Admin update access for products" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND is_admin_or_staff() = true);
CREATE POLICY "Admin delete access for products" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND is_admin_or_staff() = true);

-- Media bucket
CREATE POLICY "Public read access for media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Admin upload access for media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND is_admin_or_staff() = true);
CREATE POLICY "Admin delete access for media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND is_admin_or_staff() = true);