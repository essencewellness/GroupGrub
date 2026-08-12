-- GroupGrub schema — canonical state after migrations 001-010
-- This file is documentation / idempotent bootstrap for new environments.
-- Applied migrations are in migration_NNN_*.sql and must not be re-run.

-- ─────────────────────────────────────────────────────────────────────
-- Trips
-- owner_id is NULL in practice — app has no Supabase Auth. The column is
-- reserved for a future auth upgrade (see fetchTrips in db.js).
-- invite_token is the write-authorization secret validated server-side by
-- validateTripToken. It must NOT be readable by the anon role (see
-- migration_010 and the REVOKE at the end of this file).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists trips (
  id             text primary key,
  title          text not null default 'Nova Viagem',
  owner_id       uuid,
  template_type  text,
  start_date     date,
  end_date       date,
  pessoas        jsonb default '[]',
  plano          jsonb default '{}',
  invite_token   text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Meals
create table if not exists meals (
  id           uuid primary key default gen_random_uuid(),
  trip_id      text not null references trips(id) on delete cascade,
  nome         text not null,
  emoji        text default '🍽️',
  tipo         text,
  dia          text,
  ingredientes jsonb default '[]',
  created_at   timestamptz default now()
);

-- Shopping items
create table if not exists items (
  id           uuid primary key default gen_random_uuid(),
  trip_id      text not null references trips(id) on delete cascade,
  nome         text not null,
  categoria    text default 'outro',
  qtd          text,
  comprado     boolean default false,
  antecipado   boolean default false,
  assignee     text,
  created_at   timestamptz default now()
);

-- Expenses
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  trip_id      text not null references trips(id) on delete cascade,
  descricao    text not null,
  valor        numeric(10,2) not null,
  pago_por     text not null,
  dividir_por  jsonb default '[]',
  created_at   timestamptz default now()
);

-- Paid customers (for cross-device premium recovery via OTP)
create table if not exists customers (
  id                    uuid primary key default gen_random_uuid(),
  email                 text unique not null,
  stripe_session_id     text,
  paid_at               timestamptz default now(),
  verified_at           timestamptz,           -- set on first successful verify-session (replay guard)
  recovery_token        text,                  -- 6-digit OTP, cleared after use
  recovery_expires_at   timestamptz            -- OTP expiry (15 min window)
);

-- Rate limits (Supabase-backed, persists across Edge cold starts)
create table if not exists rate_limits (
  id      uuid primary key default gen_random_uuid(),
  ip      text not null,
  hit_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Indexes (migrations 001, 005, 006, 008)
-- ─────────────────────────────────────────────────────────────────────
-- FK indexes on child tables
create index if not exists idx_meals_trip_id      on meals     (trip_id);
create index if not exists idx_items_trip_id      on items     (trip_id);
create index if not exists idx_expenses_trip_id   on expenses  (trip_id);

-- Composite (trip_id, created_at) for ORDER BY queries (migration_008)
create index if not exists idx_items_trip_created    on items    (trip_id, created_at);
create index if not exists idx_meals_trip_created    on meals    (trip_id, created_at);
create index if not exists idx_expenses_trip_created on expenses (trip_id, created_at);

-- Customers
create index if not exists idx_customers_email          on customers (email);
create index if not exists idx_customers_stripe_session on customers (stripe_session_id)
  where stripe_session_id is not null;

-- Rate limits: composite for window query (ip + hit_at range scan)
create index if not exists idx_rate_limits_ip_hit on rate_limits (ip, hit_at);

-- ─────────────────────────────────────────────────────────────────────
-- updated_at trigger on trips (migration_007)
-- ─────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trips_updated_at
  before update on trips
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- Rate-limits cleanup trigger (migration_009)
-- Keeps the table lean: rows older than 2 hours are pruned on each insert.
-- ─────────────────────────────────────────────────────────────────────
create or replace function prune_rate_limits()
returns trigger language plpgsql as $$
begin
  delete from rate_limits where hit_at < now() - interval '2 hours';
  return new;
end;
$$;

create trigger rate_limits_cleanup
  after insert on rate_limits
  for each row execute function prune_rate_limits();

-- ─────────────────────────────────────────────────────────────────────
-- RLS
-- Anonymous-first tradeoff: the app uses the Supabase anon key (no
-- auth.users). Row-level restrictions require auth.uid() which would
-- break the zero-friction / invite-link model. The security boundary is:
--   • All writes go through Edge Functions (service_role) — anon cannot DML.
--   • Trips are access-by-ID; the ID is shared only via invite link.
--   • invite_token is readable only by service_role (column-level REVOKE
--     below), so knowing a trip ID is not enough to forge writes.
-- ─────────────────────────────────────────────────────────────────────
alter table trips     enable row level security;
alter table meals     enable row level security;
alter table items     enable row level security;
alter table expenses  enable row level security;
alter table customers enable row level security;
alter table rate_limits enable row level security;

-- trips: anon can SELECT (needed for Realtime + client reads), service_role owns writes
create policy "anon read trips"
  on trips for select using (true);

create policy "service write trips"
  on trips for all
  to service_role
  using (true) with check (true);

-- meals / items / expenses: same pattern
create policy "anon read meals"    on meals    for select using (true);
create policy "service write meals" on meals   for all to service_role using (true) with check (true);

create policy "anon read items"    on items    for select using (true);
create policy "service write items" on items   for all to service_role using (true) with check (true);

create policy "anon read expenses"    on expenses for select using (true);
create policy "service write expenses" on expenses for all to service_role using (true) with check (true);

-- customers: service_role only (anon browser cannot read/write customer PII)
create policy "service_role only insert customers" on customers for insert to service_role with check (true);
create policy "service_role only update customers" on customers for update to service_role using (true);
create policy "select customers via service_role"  on customers for select to service_role using (true);

-- rate_limits: service_role only
create policy "service only rate_limits"
  on rate_limits for all
  to service_role
  using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────
-- Column-level security: hide invite_token from anon/authenticated roles
-- (migration_010). service_role retains full table-level access.
-- ─────────────────────────────────────────────────────────────────────
revoke select (invite_token) on trips from anon;
revoke select (invite_token) on trips from authenticated;
