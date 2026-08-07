-- GroupGrub schema

-- Trips
create table if not exists trips (
  id           text primary key,
  title        text not null default 'Nova Viagem',
  owner_id     uuid,
  template_type text,
  start_date   date,
  end_date     date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
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
  participantes jsonb default '[]',
  created_at   timestamptz default now()
);

-- Paid customers (for cross-device premium recovery)
create table if not exists customers (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  stripe_session_id text,
  paid_at           timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- RLS: anonymous-first tradeoff
-- The app uses Supabase anon key (no auth.users). Without auth.uid()
-- we cannot write meaningful row-level policies — any restriction would
-- require either Supabase Auth (breaks zero-friction model) or custom
-- JWT claims (requires server middleware). Policy: trips are access-by-ID,
-- ID is shared only via invite link. This is the documented tradeoff.
-- ─────────────────────────────────────────────────────────────────────
alter table trips     enable row level security;
alter table meals     enable row level security;
alter table items     enable row level security;
alter table expenses  enable row level security;
alter table customers enable row level security;

create policy "public trips"    on trips     for all using (true) with check (true);
create policy "public meals"    on meals     for all using (true) with check (true);
create policy "public items"    on items     for all using (true) with check (true);
create policy "public expenses" on expenses  for all using (true) with check (true);

-- customers: write via service role only (API), anon browser cannot DML
create policy "service_role only insert customers" on customers for insert to service_role with check (true);
create policy "service_role only update customers" on customers for update to service_role using (true);
create policy "select customers via service_role"  on customers for select to service_role using (true);
