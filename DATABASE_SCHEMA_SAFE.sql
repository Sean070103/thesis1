-- =====================================================
-- AUTOCARPETS INVENTORY MANAGEMENT SYSTEM
-- SAFE Database Schema Update for Supabase
-- =====================================================
-- This script only adds MISSING objects and won't alter existing ones
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Use pgcrypto extension (Supabase standard)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE (Only if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index only if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- 2. MATERIALS TABLE (Only if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL DEFAULT 'PCS',
    quantity NUMERIC DEFAULT 0,
    location TEXT,
    sap_quantity NUMERIC DEFAULT 0,
    reorder_threshold NUMERIC DEFAULT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

-- =====================================================
-- 3. MATERIAL_TRANSACTIONS TABLE (Using existing name)
-- =====================================================
CREATE TABLE IF NOT EXISTS material_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code TEXT NOT NULL,
    material_description TEXT,
    transaction_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_name TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_transactions_material_code ON material_transactions(material_code);
CREATE INDEX IF NOT EXISTS idx_material_transactions_date ON material_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_material_transactions_type ON material_transactions(transaction_type);

-- =====================================================
-- 4. DEFECTS TABLE (Only if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code TEXT NOT NULL,
    material_description TEXT,
    defect_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    severity TEXT NOT NULL DEFAULT 'medium',
    description TEXT,
    reported_by TEXT NOT NULL,
    reported_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'open',
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defects_material_code ON defects(material_code);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_reported_date ON defects(reported_date DESC);

-- =====================================================
-- 5. ALERTS TABLE (Only if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('mismatch', 'low-stock', 'discrepancy', 'reorder-threshold', 'defect', 'transaction')),
    material_code TEXT NOT NULL,
    material_description TEXT,
    message TEXT NOT NULL,
    local_quantity NUMERIC DEFAULT 0,
    sap_quantity NUMERIC DEFAULT 0,
    variance NUMERIC DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'error', 'critical')),
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_material_code ON alerts(material_code);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- =====================================================
-- 6. TRIGGERS (Create or Replace - safe)
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_defects_updated_at') THEN
        CREATE TRIGGER update_defects_updated_at
            BEFORE UPDATE ON defects
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_alerts_updated_at') THEN
        CREATE TRIGGER update_alerts_updated_at
            BEFORE UPDATE ON alerts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 7. RLS POLICIES (Only add if missing)
-- =====================================================

-- Enable RLS on tables (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Add policies only if they don't exist
DO $$
BEGIN
    -- Materials policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'Allow all operations on materials') THEN
        CREATE POLICY "Allow all operations on materials" ON materials FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    -- Material Transactions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'material_transactions' AND policyname = 'Allow all operations on material_transactions') THEN
        CREATE POLICY "Allow all operations on material_transactions" ON material_transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    -- Defects policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'defects' AND policyname = 'Allow all operations on defects') THEN
        CREATE POLICY "Allow all operations on defects" ON defects FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    -- Alerts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Allow all operations on alerts') THEN
        CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =====================================================
-- VERIFICATION - Run these after the script
-- =====================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM profiles LIMIT 5;
-- SELECT * FROM materials LIMIT 5;
-- SELECT * FROM material_transactions ORDER BY date DESC LIMIT 5;
-- SELECT * FROM defects ORDER BY reported_date DESC LIMIT 5;
-- SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- END OF SAFE SCHEMA
-- =====================================================
