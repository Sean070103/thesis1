-- =====================================================
-- DATABASE MIGRATION: Auto-alerts for Reorder Threshold
-- =====================================================
-- This migration adds:
-- 1. Index on reorder_threshold for better query performance
-- 2. Trigger to automatically generate alerts when quantity <= reorder_threshold
-- 3. Update alerts table to support 'reorder-threshold' type
-- Safe to run multiple times (idempotent)
-- =====================================================

-- =====================================================
-- 1. ADD INDEX ON reorder_threshold
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_materials_reorder_threshold 
ON materials(reorder_threshold) 
WHERE reorder_threshold IS NOT NULL;

-- =====================================================
-- 2. UPDATE ALERTS TABLE TO SUPPORT 'reorder-threshold' TYPE
-- =====================================================
-- First, check if we need to update the constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists and doesn't include 'reorder-threshold'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'alerts_type_check' 
        AND table_name = 'alerts'
    ) THEN
        ALTER TABLE alerts DROP CONSTRAINT alerts_type_check;
    END IF;
    
    -- Add new constraint with 'reorder-threshold' included
    ALTER TABLE alerts 
    ADD CONSTRAINT alerts_type_check 
    CHECK (type IN ('mismatch', 'low-stock', 'discrepancy', 'reorder-threshold', 'defect', 'transaction'));
    
    RAISE NOTICE 'Alerts table updated to support reorder-threshold type';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists or updated';
END $$;

-- =====================================================
-- 3. CREATE FUNCTION TO CHECK AND CREATE REORDER ALERTS
-- =====================================================
CREATE OR REPLACE FUNCTION check_reorder_threshold()
RETURNS TRIGGER AS $$
DECLARE
    alert_exists BOOLEAN;
    alert_id UUID;
BEGIN
    -- Only check if reorder_threshold is set and quantity is at or below it
    IF NEW.reorder_threshold IS NOT NULL AND NEW.quantity <= NEW.reorder_threshold THEN
        -- Check if an unacknowledged alert already exists for this material
        SELECT EXISTS(
            SELECT 1 
            FROM alerts 
            WHERE material_code = NEW.material_code 
            AND type = 'reorder-threshold' 
            AND acknowledged = false
        ) INTO alert_exists;
        
        -- Only create alert if one doesn't already exist
        IF NOT alert_exists THEN
            -- Generate alert
            INSERT INTO alerts (
                type,
                material_code,
                material_description,
                message,
                local_quantity,
                sap_quantity,
                variance,
                severity,
                acknowledged,
                created_at
            ) VALUES (
                'reorder-threshold',
                NEW.material_code,
                NEW.description,
                'Reorder threshold reached: Quantity (' || NEW.quantity || ' ' || NEW.unit || ') is at or below reorder threshold (' || NEW.reorder_threshold || ' ' || NEW.unit || ')',
                NEW.quantity,
                COALESCE(NEW.sap_quantity, 0),
                0,
                CASE 
                    WHEN NEW.quantity = 0 THEN 'critical'
                    WHEN NEW.quantity <= (NEW.reorder_threshold * 0.5) THEN 'error'
                    ELSE 'warning'
                END,
                false,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGER ON MATERIALS TABLE
-- =====================================================
DROP TRIGGER IF EXISTS trigger_check_reorder_threshold ON materials;

CREATE TRIGGER trigger_check_reorder_threshold
    AFTER INSERT OR UPDATE OF quantity, reorder_threshold ON materials
    FOR EACH ROW
    WHEN (NEW.reorder_threshold IS NOT NULL AND NEW.quantity <= NEW.reorder_threshold)
    EXECUTE FUNCTION check_reorder_threshold();

-- =====================================================
-- 5. CREATE FUNCTION TO REMOVE ALERTS WHEN QUANTITY INCREASES
-- =====================================================
CREATE OR REPLACE FUNCTION remove_reorder_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- If quantity increases above reorder threshold, acknowledge existing alerts
    IF OLD.reorder_threshold IS NOT NULL 
       AND OLD.quantity <= OLD.reorder_threshold 
       AND NEW.quantity > NEW.reorder_threshold THEN
        UPDATE alerts
        SET acknowledged = true,
            updated_at = NOW()
        WHERE material_code = NEW.material_code
        AND type = 'reorder-threshold'
        AND acknowledged = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE TRIGGER TO REMOVE ALERTS WHEN QUANTITY INCREASES
-- =====================================================
DROP TRIGGER IF EXISTS trigger_remove_reorder_alerts ON materials;

CREATE TRIGGER trigger_remove_reorder_alerts
    AFTER UPDATE OF quantity ON materials
    FOR EACH ROW
    WHEN (OLD.reorder_threshold IS NOT NULL 
          AND OLD.quantity <= OLD.reorder_threshold 
          AND NEW.quantity > NEW.reorder_threshold)
    EXECUTE FUNCTION remove_reorder_alerts();

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Test the trigger by updating a material:
-- UPDATE materials 
-- SET quantity = 5, reorder_threshold = 10 
-- WHERE material_code = 'YOUR_MATERIAL_CODE';
--
-- Check if alert was created:
-- SELECT * FROM alerts 
-- WHERE type = 'reorder-threshold' 
-- ORDER BY created_at DESC LIMIT 5;
--
-- Test removing alert by increasing quantity:
-- UPDATE materials 
-- SET quantity = 15 
-- WHERE material_code = 'YOUR_MATERIAL_CODE';
--
-- Verify alert was acknowledged:
-- SELECT * FROM alerts 
-- WHERE type = 'reorder-threshold' 
-- AND material_code = 'YOUR_MATERIAL_CODE';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
