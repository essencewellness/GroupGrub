-- Migration 004: Close anon write access — all mutations go through service_role (Edge Functions)
-- SELECT stays open so Supabase Realtime subscriptions (anon key) continue to work.

-- Drop the permissive open policies
drop policy if exists "public trips"    on trips;
drop policy if exists "public meals"    on meals;
drop policy if exists "public items"    on items;
drop policy if exists "public expenses" on expenses;

-- ── trips ──────────────────────────────────────────────────────
-- Anon can SELECT (realtime + client reads)
create policy "anon read trips"
  on trips for select using (true);

-- Only Edge Functions (service_role) can write
create policy "service write trips"
  on trips for all
  to service_role
  using (true) with check (true);

-- ── items ──────────────────────────────────────────────────────
create policy "anon read items"
  on items for select using (true);

create policy "service write items"
  on items for all
  to service_role
  using (true) with check (true);

-- ── meals ──────────────────────────────────────────────────────
create policy "anon read meals"
  on meals for select using (true);

create policy "service write meals"
  on meals for all
  to service_role
  using (true) with check (true);

-- ── expenses ───────────────────────────────────────────────────
create policy "anon read expenses"
  on expenses for select using (true);

create policy "service write expenses"
  on expenses for all
  to service_role
  using (true) with check (true);
