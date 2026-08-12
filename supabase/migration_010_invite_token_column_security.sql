-- Migration 010: Restrict invite_token column from anon reads
--
-- Problem: migration_004 gave anon SELECT on the entire trips table.
-- The invite_token column is the write-authorization secret used by
-- validateTripToken in adminClient.js.  Any browser that knows a trip ID
-- could SELECT the row via the anon key, read invite_token, and then forge
-- write requests to that trip — completely bypassing the token check.
--
-- Fix: revoke column-level SELECT on invite_token from both the anon role
-- and the authenticated role (which is also unused in this app).
-- service_role retains unrestricted access and is used by all API routes.
--
-- After this migration the anon client receives NULL for invite_token when
-- it selects a trips row (Postgres silently omits revoked columns from
-- SELECT *).  db.js has been updated to use explicit column lists that
-- exclude invite_token from all client-side queries.

REVOKE SELECT (invite_token) ON trips FROM anon;
REVOKE SELECT (invite_token) ON trips FROM authenticated;

-- Verify that service_role still has full column access (informational — no-op):
-- GRANT SELECT (invite_token) ON trips TO service_role;  -- already granted via table-level
