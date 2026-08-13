-- Migration 008: Replace single-column trip_id indexes with composite (trip_id, created_at)
--
-- All data-fetch queries follow the pattern:
--   SELECT * FROM <table> WHERE trip_id = $1 ORDER BY created_at
--
-- A single-column index on trip_id satisfies the WHERE but still requires
-- a sort step on every query. A composite index (trip_id, created_at) gives
-- PostgreSQL an index-only scan that delivers rows already sorted.

-- Create composite indexes FIRST so queries are never left unindexed.
-- Only then drop the old single-column indexes.

-- items
CREATE INDEX IF NOT EXISTS idx_items_trip_created    ON items    (trip_id, created_at);
DROP INDEX IF EXISTS idx_items_trip_id;

-- meals
CREATE INDEX IF NOT EXISTS idx_meals_trip_created    ON meals    (trip_id, created_at);
DROP INDEX IF EXISTS idx_meals_trip_id;

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_trip_created ON expenses (trip_id, created_at);
DROP INDEX IF EXISTS idx_expenses_trip_id;

-- ROLLBACK (run manually if needed — forward-only in production):
-- DROP INDEX IF EXISTS idx_items_trip_created;
-- DROP INDEX IF EXISTS idx_meals_trip_created;
-- DROP INDEX IF EXISTS idx_expenses_trip_created;
-- CREATE INDEX IF NOT EXISTS idx_items_trip_id    ON items    (trip_id);
-- CREATE INDEX IF NOT EXISTS idx_meals_trip_id    ON meals    (trip_id);
-- CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses (trip_id);
