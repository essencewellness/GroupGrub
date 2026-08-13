-- Migration 009: Auto-cleanup of stale rate_limits rows (no pg_cron required)
--
-- Strategy: instead of a scheduled job, use a trigger that runs cleanup
-- opportunistically on every INSERT into rate_limits. Each new rate-limit
-- hit deletes rows older than 1 hour in the same transaction.
--
-- This keeps the table small with zero external dependencies.
-- Worst case: a burst of inserts all clean up simultaneously — acceptable
-- because DELETE on indexed hit_at is O(rows deleted), not O(table size).

CREATE OR REPLACE FUNCTION fn_rate_limits_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM rate_limits WHERE hit_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rate_limits_cleanup ON rate_limits;

CREATE TRIGGER trg_rate_limits_cleanup
  AFTER INSERT ON rate_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION fn_rate_limits_cleanup();

-- Index on hit_at so the DELETE above is fast (not a seq scan)
CREATE INDEX IF NOT EXISTS idx_rate_limits_hit_at
  ON rate_limits (hit_at);

-- ROLLBACK (run manually if needed — forward-only in production):
-- DROP TRIGGER IF EXISTS trg_rate_limits_cleanup ON rate_limits;
-- DROP FUNCTION IF EXISTS fn_rate_limits_cleanup();
-- DROP INDEX IF EXISTS idx_rate_limits_hit_at;
