-- Migration 007: Auto-update trips.updated_at on every UPDATE
--
-- trips.updated_at has DEFAULT now() but no trigger, so it stays frozen
-- at row creation time forever. Any feature that relies on recency
-- (sorting, sync detection, cache invalidation) gets stale data.

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop first so re-running is idempotent
DROP TRIGGER IF EXISTS trg_trips_updated_at ON trips;

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ROLLBACK (run manually if needed — forward-only in production):
-- DROP TRIGGER IF EXISTS trg_trips_updated_at ON trips;
-- DROP FUNCTION IF EXISTS fn_set_updated_at();
