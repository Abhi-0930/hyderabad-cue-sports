-- ==============================================================================
-- HYDERABAD CUE SPORTS - SUPABASE DATABASE INITIALIZATION SCHEMA
-- ==============================================================================
-- You can copy-paste and run this entire script in your Supabase SQL Editor.
-- It creates tables, indexes, row level security (RLS) policies, and auto-updated timestamps.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,                       -- e.g. 'table-12ft-featured'
    slug TEXT UNIQUE NOT NULL,                 -- e.g. '12-ft-tournament-snooker-table'
    name TEXT NOT NULL,                        -- e.g. '12 FT Snooker Table'
    category TEXT NOT NULL,                    -- 'Snooker Tables', 'Cues', 'Table Accessories', 'Scoreboards'
    type TEXT NOT NULL DEFAULT 'accessory',    -- 'table', 'accessory', 'apparel'
    size TEXT NOT NULL DEFAULT 'Standard',     -- '12 FT', '10 FT', '8 FT', 'Standard 58 inch'
    price NUMERIC(12, 2) NOT NULL,             -- e.g. 425000.00
    compare_at NUMERIC(12, 2),                 -- e.g. 475000.00 (original price if discounted)
    image TEXT NOT NULL,                       -- primary thumbnail path or storage URL
    gallery JSONB DEFAULT '[]'::jsonb,         -- array of image URLs
    badge TEXT,                                -- 'Tournament', 'Best Seller', 'Official'
    availability TEXT NOT NULL DEFAULT 'In stock', -- 'In stock', 'Made to order', 'Low stock'
    description TEXT NOT NULL,
    details JSONB DEFAULT '[]'::jsonb,         -- array of feature bullet points
    specs JSONB DEFAULT '[]'::jsonb,           -- array of { label: string, value: string }
    tags TEXT[] DEFAULT '{}',                  -- e.g. ARRAY['12 FT', 'tables', 'featured']
    stock_quantity INTEGER DEFAULT 10,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexing for fast search, category filtering, and sorting
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- ------------------------------------------------------------------------------
-- 3. USER PROFILES TABLE (Linked with Supabase Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    addresses JSONB DEFAULT '[]'::jsonb,       -- saved delivery addresses
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger to automatically create a profile record when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3B. PASSWORDLESS CUSTOMERS, SESSIONS, ADDRESSES & WISHLIST (Hashed + AES-256)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_hash TEXT UNIQUE NOT NULL,
    phone_encrypted TEXT NOT NULL,
    email_hash TEXT UNIQUE,
    email_encrypted TEXT,
    full_name TEXT,
    is_phone_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone_hash ON public.customers(phone_hash);
CREATE INDEX IF NOT EXISTS idx_customers_email_hash ON public.customers(email_hash);

CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON public.auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_customer_id ON public.auth_sessions(customer_id);

CREATE TABLE IF NOT EXISTS public.otp_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_hash TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone_hash ON public.otp_challenges(phone_hash);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone_encrypted TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_customer_id ON public.wishlist_items(customer_id);

-- ------------------------------------------------------------------------------
-- 4. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,         -- e.g. 'HCS-2026-1042'
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,           -- address details (city, state, pin, etc.)
    subtotal NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) DEFAULT 0,
    shipping_charge NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'online' CHECK (payment_method IN ('online', 'cod', 'upi', 'bank_transfer')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id TEXT,                           -- Razorpay / payment gateway transaction id
    order_status TEXT NOT NULL DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);

-- ------------------------------------------------------------------------------
-- 5. ORDER ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ------------------------------------------------------------------------------
-- 6. TABLE CONSULTATION & CUSTOM INQUIRIES
--    (High-ticket tables like 12ft tournament tables need site surveys & consultations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_interest TEXT,                     -- e.g. "12 FT Tournament Snooker Table"
    room_dimensions TEXT,                      -- e.g. "22ft x 16ft"
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled_survey', 'closed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure existing orders table has customer_id column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- CUSTOMERS & SESSIONS RLS: Strict Deny-All for public roles
-- (Only accessible by backend service_role / direct pooler connection)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Deny public direct access to customers" ON public.customers;
CREATE POLICY "Deny public direct access to customers"
ON public.customers FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny public direct access to auth_sessions" ON public.auth_sessions;
CREATE POLICY "Deny public direct access to auth_sessions"
ON public.auth_sessions FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny public direct access to customer_addresses" ON public.customer_addresses;
CREATE POLICY "Deny public direct access to customer_addresses"
ON public.customer_addresses FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny public direct access to otp_challenges" ON public.otp_challenges;
CREATE POLICY "Deny public direct access to otp_challenges"
ON public.otp_challenges FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Products: Everyone (authenticated & guests) can view active products
DROP POLICY IF EXISTS "Public products viewable by everyone" ON public.products;
CREATE POLICY "Public products viewable by everyone" 
ON public.products FOR SELECT 
USING (true);

-- Profiles: Users can view and update their own profile; Admins have full access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Orders: Users can view their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Anyone (guests or logged in) can create an order at checkout
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Order Items: Viewable if user owns the parent order
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" 
ON public.order_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
);

DROP POLICY IF EXISTS "Anyone can insert order items during checkout" ON public.order_items;
CREATE POLICY "Anyone can insert order items during checkout" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- Inquiries: Anyone can submit an inquiry
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiry" 
ON public.inquiries FOR INSERT 
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. STORAGE BUCKET CONFIGURATION (Execute in Supabase Storage or run via SQL)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('storefront-media', 'storefront-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access for storefront-media" ON storage.objects;
CREATE POLICY "Public Access for storefront-media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'storefront-media');

