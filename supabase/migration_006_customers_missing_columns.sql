-- Migration 006: Add missing columns to customers table
--
-- These columns are used by the API routes but were never added to the schema:
--   verified_at       → verify-session.js  (replay attack prevention)
--   recovery_token    → recover.js + verify-recovery.js  (OTP recovery flow)
--   recovery_expires_at → recover.js + verify-recovery.js
--
-- Without these columns:
--   - The same Stripe session can activate premium multiple times (no replay guard)
--   - OTP recovery emails appear to send but the token is never stored → flow always fails

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS verified_at          timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_token       text,
  ADD COLUMN IF NOT EXISTS recovery_expires_at  timestamptz;

-- Index for the replay-prevention query in verify-session.js:
-- WHERE stripe_session_id = $1
-- Partial index: only rows that have a session_id (skips customers from recovery-only flows)
CREATE INDEX IF NOT EXISTS idx_customers_stripe_session
  ON customers (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- ROLLBACK (run manually if needed — forward-only in production):
-- DROP INDEX IF EXISTS idx_customers_stripe_session;
-- ALTER TABLE customers
--   DROP COLUMN IF EXISTS verified_at,
--   DROP COLUMN IF EXISTS recovery_token,
--   DROP COLUMN IF EXISTS recovery_expires_at;
