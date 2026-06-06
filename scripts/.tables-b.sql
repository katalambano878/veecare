-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  phone text,
  status order_status DEFAULT 'pending'::order_status,
  payment_status payment_status DEFAULT 'pending'::payment_status,
  currency text DEFAULT 'USD'::text,
  subtotal numeric NOT NULL,
  tax_total numeric DEFAULT 0,
  shipping_total numeric DEFAULT 0,
  discount_total numeric DEFAULT 0,
  total numeric NOT NULL,
  shipping_method text,
  payment_method text,
  payment_provider text,
  payment_transaction_id text,
  notes text,
  cancel_reason text,
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  payment_reminder_sent boolean DEFAULT false,
  payment_reminder_sent_at timestamptz
);

-- Order Items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id),
  product_id uuid REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  product_name text NOT NULL,
  variant_name text,
  sku text,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Order Status History
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id),
  status order_status NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Cart Items
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  product_id uuid REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Wishlist Items
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  product_id uuid REFERENCES public.products(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  product_id uuid REFERENCES public.products(id),
  user_id uuid REFERENCES auth.users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  status review_status DEFAULT 'pending'::review_status,
  verified_purchase boolean DEFAULT false,
  helpful_votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Review Images
CREATE TABLE public.review_images (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  review_id uuid REFERENCES public.reviews(id),
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Blog Posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  author_id uuid REFERENCES auth.users(id),
  status blog_status DEFAULT 'draft'::blog_status,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support Tickets
CREATE SEQUENCE IF NOT EXISTS support_tickets_ticket_number_seq;

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  ticket_number integer NOT NULL DEFAULT nextval('support_tickets_ticket_number_seq'),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  subject text NOT NULL,
  description text,
  category text,
  status ticket_status DEFAULT 'open'::ticket_status,
  priority ticket_priority DEFAULT 'medium'::ticket_priority,
  assigned_to uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support Messages
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  ticket_id uuid REFERENCES public.support_tickets(id),
  user_id uuid REFERENCES auth.users(id),
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Return Requests
CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id),
  user_id uuid REFERENCES auth.users(id),
  status return_status DEFAULT 'pending'::return_status,
  reason text NOT NULL,
  description text,
  refund_amount numeric,
  refund_method text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Return Items
CREATE TABLE public.return_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  return_request_id uuid REFERENCES public.return_requests(id),
  order_item_id uuid REFERENCES public.order_items(id),
  quantity integer NOT NULL,
  reason text,
  condition text,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Pages (CMS)
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  status text DEFAULT 'draft'::text,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Site Settings (key-value with category)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CMS Content blocks
CREATE TABLE public.cms_content (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  section text NOT NULL,
  block_key text NOT NULL,
  title text,
  subtitle text,
  content text,
  image_url text,
  button_text text,
  button_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section, block_key)
);

-- Banners
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'promotional'::text,
  title text,
  subtitle text,
  image_url text,
  background_color text DEFAULT '#000000'::text,
  text_color text DEFAULT '#FFFFFF'::text,
  button_text text,
  button_url text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  position text DEFAULT 'top'::text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Navigation Menus
CREATE TABLE public.navigation_menus (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Navigation Items
CREATE TABLE public.navigation_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  menu_id uuid REFERENCES public.navigation_menus(id),
  parent_id uuid REFERENCES public.navigation_items(id),
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  is_external boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Store Modules (feature flags)
CREATE TABLE public.store_modules (
  id text PRIMARY KEY,
  enabled boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Customers (CRM / POS)
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  phone text,
  full_name text,
  first_name text,
  last_name text,
  user_id uuid REFERENCES auth.users(id),
  default_address jsonb,
  notes text,
  tags text[],
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_order_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  secondary_phone text,
  secondary_email text
);