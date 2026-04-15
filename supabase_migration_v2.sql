-- ============================================
-- BarberPro Migration v2: Gallery & Promos
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Create Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  category TEXT,
  url TEXT,
  image TEXT,
  shop_id UUID REFERENCES shops(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on gallery
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Policies for gallery
CREATE POLICY "gallery_select_all" ON gallery FOR SELECT USING (true);
CREATE POLICY "gallery_insert_auth" ON gallery FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "gallery_update_auth" ON gallery FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "gallery_delete_auth" ON gallery FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Create Promos Table
CREATE TABLE IF NOT EXISTS promos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'percentage' or 'fixed'
  discount NUMERIC,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  service_id TEXT,
  shop_id UUID REFERENCES shops(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on promos
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

-- Policies for promos
CREATE POLICY "promos_select_all" ON promos FOR SELECT USING (true);
CREATE POLICY "promos_insert_auth" ON promos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "promos_update_auth" ON promos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "promos_delete_auth" ON promos FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Assign to default shop (if any data is inserted without shop_id)
-- Note: Already handled by application logic, but good practice.
