-- =====================================================
-- DATABASE MIGRATION: Add reorder_threshold to materials
-- =====================================================
-- This migration adds the reorder_threshold column to the materials table
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Add reorder_threshold column if it doesn't exist
DO $$
BEGIN
    -- Check if column exists, if not, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'materials' 
        AND column_name = 'reorder_threshold'
    ) THEN
        ALTER TABLE materials 
        ADD COLUMN reorder_threshold NUMERIC DEFAULT NULL;
        
        -- Add comment to document the column
        COMMENT ON COLUMN materials.reorder_threshold IS 'Threshold quantity for reorder alerts. When quantity falls at or below this value, an alert is triggered.';
        
        RAISE NOTICE 'Column reorder_threshold added to materials table';
    ELSE
        RAISE NOTICE 'Column reorder_threshold already exists in materials table';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the column was added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'materials' 
-- AND column_name = 'reorder_threshold';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
