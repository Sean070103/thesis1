# Itemized Inventory with Transaction History & Alerts

## Overview

This feature provides a comprehensive itemized inventory management system where each material item displays its complete transaction history and supports advanced alert filtering capabilities.

## Features Implemented

### 1. Itemized Inventory List
- Complete list of all inventory materials
- Each item shows detailed information (code, description, category, quantity, unit, location)
- Visual indicators for items requiring attention

### 2. Transaction History per Item
- **Expandable/Collapsible**: Click the chevron icon next to any material to view its transaction history
- **Format**: Displays transactions in the format: `Date → +quantity received` or `Date → –quantity issued`
- **Example Display**:
  ```
  January 12, 2025 → +10 items received
  January 13, 2025 → –2 items issued
  ```
- **Sorting**: Transactions are sorted by date (newest first)
- **Visual Indicators**: 
  - Green (+) for receiving transactions
  - Blue (–) for issuance transactions

### 3. Alert Filter System
Users can filter materials based on alert conditions:

#### Available Filters:
- **All Items**: Shows all materials (default)
- **Low Stock (≤10)**: Items with quantity ≤ 10 and > 0
- **Reorder Threshold**: Items where quantity ≤ reorder_threshold (custom threshold per material)
- **Critical (≤5)**: Items with quantity ≤ 5 and > 0
- **Out of Stock**: Items with quantity = 0

#### Visual Alert Indicators:
- 🔴 **Red Alert Icon**: Out of stock (quantity = 0)
- 🟠 **Orange Alert Icon**: Critical (quantity ≤ 5)
- 🟡 **Amber Alert Icon**: Low stock (quantity ≤ 10) or reorder threshold reached

### 4. Reorder Threshold Management
- **Per-Material Threshold**: Each material can have a custom reorder threshold
- **Optional Field**: Set during material creation or editing
- **Automatic Alerts**: When quantity falls at or below the threshold, alerts are automatically generated
- **Database Integration**: Stored in `materials.reorder_threshold` column

## Database Schema

### Materials Table
```sql
CREATE TABLE materials (
    id UUID PRIMARY KEY,
    material_code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL DEFAULT 'PCS',
    quantity NUMERIC DEFAULT 0,
    location TEXT,
    sap_quantity NUMERIC DEFAULT 0,
    reorder_threshold NUMERIC DEFAULT NULL,  -- NEW FIELD
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Transactions Table
```sql
CREATE TABLE material_transactions (
    id UUID PRIMARY KEY,
    material_code TEXT NOT NULL,
    material_description TEXT,
    transaction_type TEXT NOT NULL,  -- 'receiving' or 'issuance'
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    user_name TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Alerts Table (Updated)
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN (
        'mismatch', 
        'low-stock', 
        'discrepancy', 
        'reorder-threshold',  -- NEW TYPE
        'defect', 
        'transaction'
    )),
    material_code TEXT NOT NULL,
    material_description TEXT,
    message TEXT NOT NULL,
    local_quantity NUMERIC DEFAULT 0,
    sap_quantity NUMERIC DEFAULT 0,
    variance NUMERIC DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'warning',
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## Database Migrations

### Migration 1: Add reorder_threshold Column
**File**: `DATABASE_MIGRATION_REORDER_THRESHOLD.sql`

```sql
-- Adds reorder_threshold column to materials table
-- Safe to run multiple times (idempotent)
```

**To Run**:
1. Open Supabase SQL Editor
2. Copy and paste the contents of `DATABASE_MIGRATION_REORDER_THRESHOLD.sql`
3. Execute the script

**Verification**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'materials' 
AND column_name = 'reorder_threshold';
```

### Migration 2: Auto-Alerts for Reorder Threshold
**File**: `DATABASE_MIGRATION_REORDER_ALERTS.sql`

**Features**:
1. **Index on reorder_threshold**: Improves query performance
2. **Updated alerts table**: Supports 'reorder-threshold' alert type
3. **Automatic alert generation**: Trigger creates alerts when quantity ≤ reorder_threshold
4. **Automatic alert acknowledgment**: Trigger acknowledges alerts when quantity increases above threshold

**To Run**:
1. Open Supabase SQL Editor
2. Copy and paste the contents of `DATABASE_MIGRATION_REORDER_ALERTS.sql`
3. Execute the script

**How It Works**:
- When a material's quantity is updated and falls at or below its reorder_threshold, an alert is automatically created
- Only one unacknowledged alert per material (prevents duplicates)
- Severity is set based on quantity:
  - `critical`: quantity = 0
  - `error`: quantity ≤ 50% of threshold
  - `warning`: otherwise
- When quantity increases above the threshold, existing alerts are automatically acknowledged

## User Interface

### Materials Page (`/materials`)

#### Header Section
- Page title: "Material Records"
- Subtitle: "Manage inventory data synchronized with SAP"
- "Add Material" button

#### Filter Section
- **Search Bar**: Search by material code, description, category, or location
- **Alert Filter Buttons**: 
  - All Items
  - Low Stock (≤10)
  - Reorder Threshold
  - Critical (≤5)
  - Out of Stock

#### Material List (Desktop View)
Table columns:
- Material Code (with expand/collapse icon and alert indicators)
- Description
- Category
- Quantity (color-coded based on alert status)
- Unit
- Location (hidden on smaller screens)
- SAP Quantity (hidden on smaller screens)
- Actions (Edit, Delete)

#### Transaction History (Expandable)
When expanded, shows:
- Section title: "Transaction History"
- List of transactions with:
  - Date in readable format (e.g., "January 12, 2025")
  - Transaction type and quantity:
    - `+10 PCS received` (green)
    - `–2 PCS issued` (blue)

#### Mobile View
- Card-based layout
- Same functionality as desktop
- Transaction history appears below material details when expanded

### Material Form

#### Fields:
- Material Code (required)
- Description (required)
- Category (required)
- Quantity (required, min: 0)
- Unit (required)
- Location (required)
- SAP Quantity (optional)
- **Reorder Threshold (optional)** - NEW FIELD
  - Placeholder: "Alert when quantity ≤ this"
  - When set, alerts will trigger when quantity falls at or below this value

## Code Implementation

### Frontend Components

#### Materials Page (`app/materials/page.tsx`)
- **State Management**:
  - `materials`: List of all materials
  - `transactions`: List of all transactions
  - `expandedItems`: Set of expanded material IDs
  - `alertFilter`: Current alert filter selection
  - `searchTerm`: Search query

- **Key Functions**:
  - `getMaterialTransactions(materialCode)`: Gets all transactions for a specific material
  - `toggleExpanded(materialId)`: Expands/collapses transaction history
  - `filteredMaterials`: Memoized filtered list based on search and alert filters

- **Alert Detection Logic**:
  ```typescript
  const hasLowStock = material.quantity <= LOW_STOCK_THRESHOLD && material.quantity > 0;
  const hasReorderAlert = material.reorderThreshold !== undefined && 
                          material.quantity <= material.reorderThreshold && 
                          material.quantity > 0;
  const isCritical = material.quantity <= 5 && material.quantity > 0;
  const isOutOfStock = material.quantity === 0;
  ```

### Backend/Storage

#### Supabase Storage Functions (`lib/supabase-storage.ts`)

**Updated Functions**:
- `getMaterialsFromSupabase()`: Now includes `reorderThreshold` in mapping
- `saveMaterialToSupabase()`: Now saves `reorderThreshold` to database

**Mapping**:
```typescript
// Reading from database
reorderThreshold: m.reorder_threshold ? Number(m.reorder_threshold) : undefined

// Writing to database
reorder_threshold: material.reorderThreshold
```

## Usage Examples

### Example 1: Setting Up a Material with Reorder Threshold

1. Click "Add Material" button
2. Fill in material details:
   - Material Code: `RM-001`
   - Description: `Steel Plate 2mm`
   - Category: `Raw Materials`
   - Quantity: `100`
   - Unit: `PCS`
   - Location: `Warehouse A`
   - **Reorder Threshold: `20`** ← Set this to trigger alerts when quantity ≤ 20
3. Click "Add Material"

### Example 2: Viewing Transaction History

1. Navigate to Materials page
2. Find a material with transactions (indicated by chevron icon)
3. Click the chevron icon to expand
4. View transaction history:
   ```
   Transaction History
   ┌─────────────────────────────────────────┐
   │ January 15, 2025  →  +50 PCS received   │
   │ January 14, 2025  →  –10 PCS issued     │
   │ January 12, 2025  →  +100 PCS received   │
   └─────────────────────────────────────────┘
   ```

### Example 3: Filtering by Alert Status

1. Navigate to Materials page
2. Use alert filter buttons:
   - Click "Low Stock (≤10)" to see only items with quantity ≤ 10
   - Click "Reorder Threshold" to see items at or below their custom threshold
   - Click "Critical (≤5)" to see items with quantity ≤ 5
   - Click "Out of Stock" to see items with quantity = 0
3. Results update in real-time

### Example 4: Automatic Alert Generation

1. Create a material with:
   - Quantity: `25`
   - Reorder Threshold: `20`
2. Create an issuance transaction that reduces quantity to `18`
3. **Automatic**: Database trigger creates an alert:
   - Type: `reorder-threshold`
   - Severity: `warning`
   - Message: "Reorder threshold reached: Quantity (18 PCS) is at or below reorder threshold (20 PCS)"
4. Material now shows amber alert icon
5. When quantity increases above 20 (e.g., receiving transaction), alert is automatically acknowledged

## Alert Severity Levels

The system automatically assigns severity based on quantity relative to threshold:

| Condition | Severity | Color |
|-----------|----------|-------|
| quantity = 0 | `critical` | Red |
| quantity ≤ 50% of threshold | `error` | Orange |
| quantity ≤ threshold | `warning` | Amber |

## Best Practices

1. **Set Reorder Thresholds**: Set appropriate reorder thresholds for each material based on:
   - Average consumption rate
   - Lead time for reordering
   - Minimum safety stock level

2. **Regular Monitoring**: Use alert filters to regularly check:
   - Low stock items
   - Items at reorder threshold
   - Critical items

3. **Transaction History Review**: Regularly review transaction history to:
   - Track material movement patterns
   - Identify trends
   - Audit inventory changes

4. **Alert Management**: 
   - Acknowledge alerts when action is taken
   - Review unacknowledged alerts regularly
   - Use alerts to trigger reorder processes

## Technical Notes

### Performance Considerations
- Transaction history is loaded once and filtered client-side
- Index on `reorder_threshold` improves filter query performance
- Index on `material_code` in transactions table for fast lookups

### Data Consistency
- Transaction history is read-only (display only)
- Transactions are created through the Transactions page
- Material quantities are automatically updated when transactions are created

### Error Handling
- Graceful fallback to localStorage if Supabase is not configured
- Validation ensures reorder_threshold is a positive number
- Null handling for optional fields

## Future Enhancements (Optional)

1. **Export Transaction History**: Export transaction history per material to PDF/CSV
2. **Transaction History Filtering**: Filter transactions by date range within material view
3. **Bulk Reorder Threshold Update**: Set reorder thresholds for multiple materials at once
4. **Alert Notifications**: Email/SMS notifications when reorder threshold is reached
5. **Historical Trends**: Chart showing quantity changes over time per material
6. **Reorder Suggestions**: Automatic suggestions based on consumption patterns

## Troubleshooting

### Issue: Transaction history not showing
**Solution**: 
- Ensure transactions exist for the material
- Check that material code matches between materials and transactions
- Verify database connection

### Issue: Alerts not generating automatically
**Solution**:
- Verify migration `DATABASE_MIGRATION_REORDER_ALERTS.sql` was executed
- Check that triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE '%reorder%';`
- Verify reorder_threshold is set on the material

### Issue: Filter not working correctly
**Solution**:
- Clear browser cache
- Verify material data has correct quantity values
- Check that reorder_threshold is set if using "Reorder Threshold" filter

## Support

For issues or questions:
1. Check database migrations are applied
2. Verify Supabase connection
3. Review browser console for errors
4. Check database logs in Supabase dashboard

---

**Last Updated**: 2025
**Version**: 1.0.0
