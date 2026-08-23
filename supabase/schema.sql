-- ==============================================================================
-- RN 3D Manager - Database Schema & Row Level Security (RLS) Policy Script
-- Execute this script in your Supabase SQL Editor (supabase.com -> SQL Editor)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  is_keychain BOOLEAN DEFAULT false,
  description TEXT,
  image_url TEXT,
  material TEXT NOT NULL DEFAULT 'PLA',
  color TEXT NOT NULL DEFAULT 'Preto',
  weight_gram NUMERIC(10,2) NOT NULL DEFAULT 0,
  length_mm NUMERIC(10,2) DEFAULT 0,
  width_mm NUMERIC(10,2) DEFAULT 0,
  height_mm NUMERIC(10,2) DEFAULT 0,
  avg_print_time_minutes INT DEFAULT 0,
  batch_quantity INT DEFAULT 1,
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  standard_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_price NUMERIC(10,2) DEFAULT 0,
  suggested_retail_price NUMERIC(10,2) DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  allows_customization BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Ativo'
);

-- 3. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  fantasy_name TEXT,
  avatar_url TEXT,
  document TEXT NOT NULL,
  responsible TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  type TEXT NOT NULL DEFAULT 'Cliente direto',
  agreed_price_level TEXT DEFAULT 'Padrão',
  visit_frequency TEXT DEFAULT '15 dias',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  last_visit_date DATE,
  next_visit_date DATE
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code TEXT UNIQUE NOT NULL, -- e.g. PED-000081
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  items_count INT DEFAULT 0,
  total_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  payment_status_text TEXT DEFAULT 'Pendente',
  status TEXT NOT NULL DEFAULT 'Novo', -- 'Novo', 'Aguardando pagamento', 'Em produção', 'Pronto', 'Entregue', 'Cancelado'
  production_progress_pct INT DEFAULT 0,
  production_sla_date DATE,
  estimated_delivery_date DATE
);

-- 4.1 ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 5. QUOTES TABLE
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_code TEXT UNIQUE NOT NULL, -- e.g. ORC-000034
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  validity_days INT DEFAULT 15,
  production_sla_days INT DEFAULT 7,
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Rascunho' -- 'Rascunho', 'Enviado', 'Aprovado', 'Recusado'
);

-- 5.1 QUOTE ITEMS TABLE
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 6. CONSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS consignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consignment_code TEXT UNIQUE NOT NULL, -- e.g. REM-000041
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  items_count INT DEFAULT 0,
  total_value NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  last_audit_date DATE,
  notes TEXT
);

-- 7. INVENTORY MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity_delta INT NOT NULL,
  type TEXT NOT NULL, -- 'Entrada', 'Saída', 'Consignação', 'Venda', 'Troca', 'Ajuste', 'Produção'
  client_name TEXT,
  reference_code TEXT,
  notes TEXT
);

-- 8. SALES TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_amount NUMERIC(10,2) DEFAULT 0,
  balance NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'PIX',
  status TEXT DEFAULT 'Pago',
  due_date DATE,
  reference_code TEXT
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allows full read and write access for both anonymous and authenticated sessions
-- ==============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if needed to prevent duplicates
DROP POLICY IF EXISTS "Public access on products" ON products;
DROP POLICY IF EXISTS "Public access on clients" ON clients;
DROP POLICY IF EXISTS "Public access on orders" ON orders;
DROP POLICY IF EXISTS "Public access on order_items" ON order_items;
DROP POLICY IF EXISTS "Public access on quotes" ON quotes;
DROP POLICY IF EXISTS "Public access on quote_items" ON quote_items;
DROP POLICY IF EXISTS "Public access on consignments" ON consignments;
DROP POLICY IF EXISTS "Public access on inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Public access on sales_transactions" ON sales_transactions;

-- Create Policies granting public read/write access to anon + authenticated roles
CREATE POLICY "Public access on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on quotes" ON quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on quote_items" ON quote_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on consignments" ON consignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on sales_transactions" ON sales_transactions FOR ALL USING (true) WITH CHECK (true);
