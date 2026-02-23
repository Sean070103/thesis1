`    -- =====================================================
    -- DATABASE MIGRATION: Daily Material Entries with Photos
    -- =====================================================
    -- This migration creates a table for daily material entries
    -- with photo upload support
    -- Safe to run multiple times (idempotent)
    -- =====================================================

    -- =====================================================
    -- 1. CREATE DAILY_MATERIAL_ENTRIES TABLE
    -- =====================================================
    CREATE TABLE IF NOT EXISTS daily_material_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        material_code TEXT NOT NULL,
        material_description TEXT,
        quantity NUMERIC NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'PCS',
        photos TEXT[], -- Array of photo URLs/paths
        notes TEXT,
        entered_by TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure one entry per material per day
        CONSTRAINT unique_material_per_day UNIQUE (date, material_code)
    );

    -- =====================================================
    -- 2. CREATE INDEXES FOR PERFORMANCE
    -- =====================================================
    CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_material_entries(date DESC);
    CREATE INDEX IF NOT EXISTS idx_daily_entries_material_code ON daily_material_entries(material_code);
    CREATE INDEX IF NOT EXISTS idx_daily_entries_date_material ON daily_material_entries(date, material_code);

    -- =====================================================
    -- 3. CREATE FUNCTION TO UPDATE updated_at
    -- =====================================================
    CREATE OR REPLACE FUNCTION update_daily_entries_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- =====================================================
    -- 4. CREATE TRIGGER FOR AUTO-UPDATING updated_at
    -- =====================================================
    DROP TRIGGER IF EXISTS update_daily_entries_updated_at ON daily_material_entries;

    CREATE TRIGGER update_daily_entries_updated_at
        BEFORE UPDATE ON daily_material_entries
        FOR EACH ROW
        EXECUTE FUNCTION update_daily_entries_updated_at();

    -- =====================================================
    -- 5. ADD COMMENT TO DOCUMENT THE TABLE
    -- =====================================================
    COMMENT ON TABLE daily_material_entries IS 'Daily material entries with photo uploads for monthly tracking';
    COMMENT ON COLUMN daily_material_entries.photos IS 'Array of photo URLs stored in Supabase Storage';
    COMMENT ON COLUMN daily_material_entries.date IS 'Date of the entry in YYYY-MM-DD format';

    -- =====================================================
    -- 6. ENABLE ROW LEVEL SECURITY (RLS)
    -- =====================================================
    ALTER TABLE daily_material_entries ENABLE ROW LEVEL SECURITY;

    -- Permissive policy for authenticated users
    DROP POLICY IF EXISTS "Allow all operations on daily_entries" ON daily_material_entries;
    CREATE POLICY "Allow all operations on daily_entries" ON daily_material_entries
        FOR ALL USING (true) WITH CHECK (true);

    -- =====================================================
    -- VERIFICATION QUERIES (Run after creating table)
    -- =====================================================
    -- Check table exists:
    -- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_material_entries';

    -- Check structure:
    -- SELECT column_name, data_type, is_nullable 
    -- FROM information_schema.columns 
    -- WHERE table_schema = 'public' 
    -- AND table_name = 'daily_material_entries'
    -- ORDER BY ordinal_position;

    -- =====================================================
    -- END OF MIGRATION
    -- =====================================================
`