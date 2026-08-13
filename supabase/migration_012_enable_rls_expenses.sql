-- Migration 012: enable RLS on expenses
-- expenses was the one table where RLS itself was never turned on, even
-- though the "anon read expenses" / "service write expenses" policies
-- already existed (schema.sql). With RLS off, those policies were never
-- enforced — the anon key could read AND write directly, bypassing
-- api/expenses.js entirely. Confirmed no client code writes to expenses
-- directly (src/lib/db.js only ever does a select on this table; all
-- writes go through the api/expenses.js proxy), so this closes the gap
-- with no functional change for legitimate traffic.

alter table expenses enable row level security;
