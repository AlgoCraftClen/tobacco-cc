-- Prototype sync — schema changes needed by the HTML tracker
-- Run this ONCE in Supabase SQL editor. Safe to re-run.
-- Dashboard: https://supabase.com/dashboard/project/njpkqemgpbstrbsaxpbz/sql

-- 1. Convert shipment IDs from UUID to TEXT so the prototype can use
-- friendly identifiers like "SHP-002" instead of long UUIDs.
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_shipment_id_fkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_shipment_id_fkey;
ALTER TABLE shipments_v2 ALTER COLUMN id DROP DEFAULT;
ALTER TABLE shipments_v2 ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE expenses ALTER COLUMN shipment_id TYPE TEXT USING shipment_id::text;
-- sales.shipment_id is already TEXT (per current DB inspection)


-- Sales: extra display fields the prototype captures per row
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS product TEXT,
  ADD COLUMN IF NOT EXISTS customer TEXT,
  ADD COLUMN IF NOT EXISTS boxes_sold NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rolls_sold NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loose_cans_sold NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Expenses (operations ledger): receipt/proof link
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS receipt TEXT;

-- Realtime replication so both partners see each other's changes
ALTER PUBLICATION supabase_realtime ADD TABLE shipments_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;

-- If the shipments_v2 status column has a CHECK constraint that doesn't allow
-- the prototype's title-case values ('Planned', 'In Transit', 'Received'),
-- drop it. The prototype writes those literal strings.
ALTER TABLE shipments_v2 DROP CONSTRAINT IF EXISTS shipments_v2_status_check;
