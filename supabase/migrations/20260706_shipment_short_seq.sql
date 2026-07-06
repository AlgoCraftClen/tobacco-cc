-- Permanent, monotonically-increasing short number per shipment so display
-- labels like "SHP #3" stay stable forever — deleting an earlier shipment
-- must not renumber the later ones, because overhead costs are tracked
-- against these labels. Safe to re-run.

CREATE SEQUENCE IF NOT EXISTS shipments_v2_short_seq;

ALTER TABLE shipments_v2
  ADD COLUMN IF NOT EXISTS short_seq INTEGER;

-- Backfill any rows still missing a number, in creation order, without
-- reusing values that were already assigned by a prior partial run.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS n
    FROM shipments_v2
   WHERE short_seq IS NULL
)
UPDATE shipments_v2 s
   SET short_seq = ordered.n + COALESCE(
                     (SELECT MAX(short_seq) FROM shipments_v2), 0)
  FROM ordered
 WHERE s.id = ordered.id;

-- Advance the sequence past whatever is now the max so subsequent inserts
-- pick up from where the backfill left off.
SELECT setval(
  'shipments_v2_short_seq',
  GREATEST(1, COALESCE((SELECT MAX(short_seq) FROM shipments_v2), 0))
);

ALTER TABLE shipments_v2
  ALTER COLUMN short_seq SET DEFAULT nextval('shipments_v2_short_seq');
ALTER TABLE shipments_v2
  ALTER COLUMN short_seq SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shipments_v2_short_seq_key'
  ) THEN
    ALTER TABLE shipments_v2
      ADD CONSTRAINT shipments_v2_short_seq_key UNIQUE (short_seq);
  END IF;
END $$;
