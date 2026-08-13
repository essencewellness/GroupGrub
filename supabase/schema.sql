-- GroupGrub schema — canonical state after migrations 001-011
-- This file is documentation / idempotent bootstrap for new environments.
-- Applied migrations are in migration_NNN_*.sql and must not be re-run.
-- The app is free for anyone with the link — no accounts, no payment.

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

-- ─────────────────────────────────────────────────────────────────────
-- Column-level security: hide invite_token from anon/authenticated roles
-- (migration_010). service_role retains full table-level access.
-- ─────────────────────────────────────────────────────────────────────
revoke select (invite_token) on trips from anon;
revoke select (invite_token) on trips from authenticated;
