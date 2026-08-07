-- Migration 001: Performance indexes + invite_token on trips
-- RLS stays `using (true)` — meaningful row-level restrictions require auth.uid()
-- which breaks the anonymous-first model. This is a documented tradeoff.

-- ────────────────────────────────────────────────────────────────────
-- 1. Add invite_token to trips (stored server-side for future RLS use)
-- ────────────────────────────────────────────────────────────────────
alter table trips
  add column if not exists invite_token text;

-- ────────────────────────────────────────────────────────────────────
-- 2. B-tree indexes on trip_id for all child tables
-- ────────────────────────────────────────────────────────────────────
create index if not exists idx_meals_trip_id     on meals     (trip_id);
create index if not exists idx_items_trip_id     on items     (trip_id);
create index if not exists idx_expenses_trip_id  on expenses  (trip_id);

-- customers: index on email (already unique, index is implicit, but explicit for clarity)
create index if not exists idx_customers_email   on customers (email);

-- ────────────────────────────────────────────────────────────────────
-- 3. customers: tighten — service role only for insert, anon can't write
-- ────────────────────────────────────────────────────────────────────
-- Drop the permissive insert policy (anyone could insert fake customers)
drop policy if exists "insert customers" on customers;

-- Only service_role (server-side API) can insert/update customers
-- The anon key used by the browser cannot do DML on customers
create policy "service_role only insert customers"
  on customers for insert
  to service_role
  with check (true);

create policy "service_role only update customers"
  on customers for update
  to service_role
  using (true);

-- Select: anyone can check if their email is paid (needed for recovery flow)
-- The recover API uses service_role anyway, but this keeps it explicit
drop policy if exists "select customers" on customers;
create policy "select customers via service_role"
  on customers for select
  to service_role
  using (true);
