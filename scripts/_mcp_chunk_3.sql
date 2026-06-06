-- 5. INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

-- Addresses
CREATE INDEX idx_addresses_user_id ON public.addresses USING btree (user_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

-- Categories
CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);
CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);

-- Products
CREATE INDEX idx_products_category ON public.products USING btree (category_id);
CREATE INDEX idx_products_featured ON public.products USING btree (featured);
CREATE INDEX idx_products_slug ON public.products USING btree (slug);
CREATE INDEX idx_products_status ON public.products USING btree (status);
CREATE INDEX idx_products_tags ON public.products USING gin (tags);

-- Blog Posts
CREATE INDEX idx_blog_slug ON public.blog_posts USING btree (slug);
CREATE INDEX idx_blog_status ON public.blog_posts USING btree (status);

-- Coupons
CREATE INDEX idx_coupons_code ON public.coupons USING btree (code);

-- Orders
CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);
CREATE INDEX idx_orders_pending_reminders ON public.orders USING btree (created_at)
  WHERE payment_status <> 'paid'::payment_status AND payment_reminder_sent = false;

-- Order Items
CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);

-- Notifications
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);
CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id) WHERE read_at IS NULL;

-- Reviews
CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);
CREATE INDEX idx_reviews_status ON public.reviews USING btree (status);

-- Support Tickets
CREATE INDEX idx_tickets_status ON public.support_tickets USING btree (status);
CREATE INDEX idx_tickets_user ON public.support_tickets USING btree (user_id);

-- Customers
CREATE INDEX idx_customers_email ON public.customers USING btree (email);
CREATE INDEX idx_customers_user_id ON public.customers USING btree (user_id);
CREATE INDEX idx_customers_secondary_email ON public.customers USING btree (secondary_email);
CREATE INDEX idx_customers_secondary_phone ON public.customers USING btree (secondary_phone);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_return_requests_updated_at BEFORE UPDATE ON public.return_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Review rating stats trigger
CREATE TRIGGER tr_update_product_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_product_rating_stats();

-- Auth trigger: auto-create profile on signup
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================