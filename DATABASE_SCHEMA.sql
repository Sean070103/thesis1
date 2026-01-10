-- =====================================================
-- AUTOCARPETS INVENTORY MANAGEMENT SYSTEM
-- Complete Database Schema for Supabase
-- =====================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This will create all necessary tables for:
-- - Materials (inventory items)
-- - Transactions (receiving/issuance records)
-- - Defects (defect reports)
-- - Alerts (system alerts for mismatches, low stock, etc.)
-- - Profiles (user profiles)
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (User Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- 2. MATERIALS TABLE (Inventory Items)
-- =====================================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL DEFAULT 'PCS',
    quantity NUMERIC DEFAULT 0,
    location TEXT,
    sap_quantity NUMERIC DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

-- =====================================================
-- 3. TRANSACTIONS TABLE (Receiving & Issuance)
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_code TEXT NOT NULL,
    material_description TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receiving', 'issuance')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'PCS',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_name TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_material_code ON transactions(material_code);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- =====================================================
-- 4. DEFECTS TABLE (Defect Reports)
-- =====================================================
CREATE TABLE IF NOT EXISTS defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_code TEXT NOT NULL,
    material_description TEXT,
    defect_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'PCS',
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    reported_by TEXT NOT NULL,
    reported_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_defects_material_code ON defects(material_code);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_reported_date ON defects(reported_date DESC);

-- =====================================================
-- 5. ALERTS TABLE (System Alerts)
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('mismatch', 'low-stock', 'discrepancy')),
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_alerts_material_code ON alerts(material_code);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- =====================================================
-- 6. TRIGGERS FOR AUTO-UPDATING updated_at
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to defects table
DROP TRIGGER IF EXISTS update_defects_updated_at ON defects;
CREATE TRIGGER update_defects_updated_at
    BEFORE UPDATE ON defects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to alerts table
DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Note: Enable RLS for production security
-- For development/testing, these are set to permissive

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users (adjust for production)
-- Profiles
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
CREATE POLICY "Allow authenticated users to update profiles" ON profiles
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON profiles;
CREATE POLICY "Allow authenticated users to delete profiles" ON profiles
    FOR DELETE USING (true);

-- Materials
DROP POLICY IF EXISTS "Allow all operations on materials" ON materials;
CREATE POLICY "Allow all operations on materials" ON materials
    FOR ALL USING (true) WITH CHECK (true);

-- Transactions
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;
CREATE POLICY "Allow all operations on transactions" ON transactions
    FOR ALL USING (true) WITH CHECK (true);

-- Defects
DROP POLICY IF EXISTS "Allow all operations on defects" ON defects;
CREATE POLICY "Allow all operations on defects" ON defects
    FOR ALL USING (true) WITH CHECK (true);

-- Alerts
DROP POLICY IF EXISTS "Allow all operations on alerts" ON alerts;
CREATE POLICY "Allow all operations on alerts" ON alerts
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 8. INSERT DEFAULT ADMIN USER (Optional)
-- =====================================================
-- This creates a default admin user if none exists
-- Password should be changed after first login

INSERT INTO profiles (email, name, role, department, is_active)
SELECT 'admin@autocarpets.com', 'System Admin', 'admin', 'IT', true
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'admin@autocarpets.com'
);

-- =====================================================
-- 9. INSERT SAMPLE MATERIALS (Optional)
-- =====================================================
-- Uncomment to add sample materials

/*
INSERT INTO materials (material_code, description, category, unit, quantity, location, sap_quantity)
VALUES 
    ('RM-01-06-0021', 'BI PIPE 1MM x RP OD 25.4MM x 20" SCHED', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0059', 'PE TRANS POLYBAG UV CUSHION (20 x 53 x 26 mic)', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0060', 'PE TRANS SLT ONE SIDE UV BACK REST (10 x 100 x 26 mic)', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0079', 'MS PLATE 2MM BACK REST ER BRKT – LITE ACE', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0080', 'MS PLATE 2MM MID LEG BRKT (RH / LH) – LITE ACE', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0054', 'FOAM 25MM BACK REST UV Lite Ace (158.75mm x 2235.22mm)', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0055', 'FOAM 50MM SEAT CUSHION UV Lite Ace (349.25mm x 1117.6mm)', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0056', 'FOAM 5MM SC UV Lite Ace (101.6mm x 2908.3mm)', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0057', 'FOAM 5MM BR UV Lite Ace (88.9mm x 4699mm)', 'Raw Materials', 'PCS', 0, 'Warehouse', 0),
    ('RM-01-06-0058', 'TRICOT 8MM (SC / BR) UV Lite Ace (340mm x 1140mm)', 'Raw Materials', 'PCS', 0, 'Warehouse', 0)
ON CONFLICT (material_code) DO NOTHING;
*/

-- =====================================================
-- VERIFICATION QUERIES (Run after creating tables)
-- =====================================================
-- Check all tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check profiles table:
-- SELECT * FROM profiles;

-- Check materials table:
-- SELECT * FROM materials;

-- Check transactions table:
-- SELECT * FROM transactions ORDER BY date DESC LIMIT 10;

-- Check defects table:
-- SELECT * FROM defects ORDER BY reported_date DESC LIMIT 10;

-- Check alerts table:
-- SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
