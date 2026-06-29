-- CC Tobacco OS — Database Migration (Excel Formula Alignment)
-- Run this in Supabase SQL Editor after restoring the project

-- ============================================================
-- 1. Update shipments_v2 table
-- ============================================================

-- Add new columns for per-shipment unit ratios and costs
ALTER TABLE IF EXISTS shipments_v2
  ADD COLUMN IF NOT EXISTS cases_per_box INTEGER DEFAULT 6,
  ADD COLUMN IF NOT EXISTS rolls_per_case INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS cans_per_roll INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS cost_per_case NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clenny_product_invest NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clanny_product_invest NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_sale_price_per_can NUMERIC DEFAULT 0;

-- Add new status value
ALTER TABLE IF EXISTS shipments_v2
  DROP CONSTRAINT IF EXISTS shipments_v2_status_check;

-- Note: If the status column has a CHECK constraint, update it to include 'in_transit'
-- If using a text column without constraint, no action needed

-- ============================================================
-- 2. Update expenses table
-- ============================================================

ALTER TABLE IF EXISTS expenses
  ADD COLUMN IF NOT EXISTS date TEXT,
  ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 3. Create sales table (NEW)
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id TEXT NOT NULL,
  date TEXT NOT NULL,
  cases_sold NUMERIC DEFAULT 0,
  cans_per_case NUMERIC DEFAULT 90,
  total_cans NUMERIC DEFAULT 0,
  price_per_can NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  cash_collector TEXT NOT NULL DEFAULT 'Clenny',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by shipment
CREATE INDEX IF NOT EXISTS idx_sales_shipment_id ON sales(shipment_id);
CREATE INDEX IF NOT EXISTS idx_sales_cash_collector ON sales(cash_collector);

-- ============================================================
-- 4. Migrate existing data (best-effort)
-- ============================================================

-- Set default unit ratios for existing shipments
UPDATE shipments_v2
SET
  cases_per_box = 6,
  rolls_per_case = 18,
  cans_per_roll = 5
WHERE cases_per_box IS NULL;

-- Convert old price_per_can to cost_per_case (approximate)
-- If old price_per_can exists, cost_per_case = price_per_can * 90
UPDATE shipments_v2
SET cost_per_case = COALESCE(price_per_can * 90, 0)
WHERE cost_per_case = 0 AND price_per_can > 0;

-- Convert old sale_price_per_can to target_sale_price_per_can
UPDATE shipments_v2
SET target_sale_price_per_can = COALESCE(sale_price_per_can, 0)
WHERE target_sale_price_per_can = 0;

-- Set default investments from old subtotal (Clanny funded everything historically)
UPDATE shipments_v2
SET
  clanny_product_invest = COALESCE(subtotal, grand_total, 0),
  clenny_product_invest = 0
WHERE clanny_product_invest = 0 AND clenny_product_invest = 0;

-- ============================================================
-- 5. RLS Policies (if using Row Level Security)
-- ============================================================

-- Enable RLS on sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY IF NOT EXISTS "Allow all operations on sales"
  ON sales FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. Notes for manual cleanup
-- ============================================================

-- After migration, you may want to drop deprecated columns:
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS cases;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS rolls;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS cans;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS price_per_can;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS subtotal;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS misc_cost;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS misc_desc;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS grand_total;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS sender;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS receiver;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS sale_total;
-- ALTER TABLE shipments_v2 DROP COLUMN IF EXISTS sale_price_per_can;
--
-- DO NOT DROP these columns until the app is fully updated and tested.
