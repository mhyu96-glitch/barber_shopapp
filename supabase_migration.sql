-- ============================================
-- BarberPro Multi-Tenant Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read shops (for portal)
CREATE POLICY "shops_select" ON shops FOR SELECT USING (true);
-- Policy: only owner can update their shop
CREATE POLICY "shops_update" ON shops FOR UPDATE USING (auth.uid() = owner_id);
-- Policy: authenticated users can insert
CREATE POLICY "shops_insert" ON shops FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 2. Add shop_id column to all data tables
ALTER TABLE services ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);

-- 3. Create a default shop for existing data
INSERT INTO shops (slug, name) 
VALUES ('default', 'BarberPro Studio')
ON CONFLICT (slug) DO NOTHING;

-- 4. Assign all existing data to the default shop
UPDATE services SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE barbers SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE customers SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE appointments SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE payments SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE inventory SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE expenses SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE attendance SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE profiles SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;
UPDATE settings SET shop_id = (SELECT id FROM shops WHERE slug = 'default') WHERE shop_id IS NULL;

-- 5. Create index for faster shop-scoped queries
CREATE INDEX IF NOT EXISTS idx_services_shop ON services(shop_id);
CREATE INDEX IF NOT EXISTS idx_barbers_shop ON barbers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_shop ON appointments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_shop ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shop ON inventory(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_attendance_shop ON attendance(shop_id);
CREATE INDEX IF NOT EXISTS idx_profiles_shop ON profiles(shop_id);
CREATE INDEX IF NOT EXISTS idx_settings_shop ON settings(shop_id);

-- Done! All existing data is now under the 'default' shop.
