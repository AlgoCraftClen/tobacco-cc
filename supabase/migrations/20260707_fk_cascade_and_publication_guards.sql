-- Two fixes for prior migration hygiene, both safe to re-run:
--
-- 1) Re-add foreign keys with ON DELETE CASCADE. The 20260705 migration
--    dropped the FKs on expenses.shipment_id and sales.shipment_id and
--    never re-added them, leaving the DB unable to catch orphaned rows
--    when a shipment delete only partially succeeds.
--
-- 2) Make the realtime publication membership adds truly idempotent.
--    20260705 does ALTER PUBLICATION ... ADD TABLE ... unconditionally,
--    which errors if the table is already a member — so that migration
--    was NOT actually re-runnable despite its comment claiming to be.

-- Clean up any orphans left over from prior partial deletes, so the FK
-- ADDs below don't fail with "insert or update violates foreign key".
DELETE FROM expenses WHERE shipment_id IS NOT NULL
  AND shipment_id NOT IN (SELECT id FROM shipments_v2);
DELETE FROM sales    WHERE shipment_id IS NOT NULL
  AND shipment_id NOT IN (SELECT id FROM shipments_v2);

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_shipment_id_fkey;
ALTER TABLE sales    DROP CONSTRAINT IF EXISTS sales_shipment_id_fkey;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_shipment_id_fkey
  FOREIGN KEY (shipment_id) REFERENCES shipments_v2(id) ON DELETE CASCADE;

ALTER TABLE sales
  ADD CONSTRAINT sales_shipment_id_fkey
  FOREIGN KEY (shipment_id) REFERENCES shipments_v2(id) ON DELETE CASCADE;

-- Guarded publication membership. Only ADD if not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'shipments_v2'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shipments_v2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'sales'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sales;
  END IF;
END $$;
