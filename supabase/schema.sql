-- Schema para Férias Celorico — App PWA (1 app only)
-- Corre isto no SQL Editor do teu projeto Supabase

-- ═══════════════════════════════════════════════
-- 1. TRIPS TABLE (multi-trip support)
-- ═══════════════════════════════════════════════
create table if not exists trips (
  id              uuid default gen_random_uuid() primary key,
  title           text not null default 'Nova Viagem',
  owner_id        text, -- optional — free users use anonymous IDs
  template_type   text, -- 'praia', 'montanha', 'camping', 'city'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ═══════════════════════════════════════════════
-- 2. ITEMS TABLE (existing — updated with assignee)
-- ═══════════════════════════════════════════════
create table if not exists items (
  id          text primary key,
  trip_id     text not null,
  nome        text not null,
  qtd         text default '',
  categoria   text,
  antecipado  boolean default false,
  comprado    boolean default false,
  assignee    text default '',
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════════
-- 3. MEALS TABLE (existing)
-- ═══════════════════════════════════════════════
create table if not exists meals (
  id           text primary key,
  trip_id      text not null,
  nome         text not null,
  emoji        text default '🍽️',
  tipo         text default 'Refeição',
  ingredientes jsonb default '[]',
  created_at   timestamptz default now()
);

-- ═══════════════════════════════════════════════
-- 4. PLANNING (meal plan grid)
-- ═══════════════════════════════════════════════
create table if not exists plano (
  id          text primary key,
  trip_id     text not null,
  slot_key    text not null,  -- ex: "segunda-almoco"
  selection   text,          -- meal ID selected
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════════
-- 5. TEMPLATES SEED DATA (for template selector)
-- ═══════════════════════════════════════════════
insert into trips (id, title, owner_id, template_type, created_at, updated_at) values
  ('template-praia', 'Template: Praia', null, 'praia', now(), now()),
  ('template-montanha', 'Template: Montanha', null, 'montanha', now(), now()),
  ('template-camping', 'Template: Camping', null, 'camping', now(), now()),
  ('template-city', 'Template: City Break', null, 'city', now(), now())
on conflict (id) do update set
  title = excluded.title,
  template_type = excluded.template_type;

-- ═══════════════════════════════════════════════
-- 6. POLICIES (public access — uses unique trip IDs)
-- ═══════════════════════════════════════════════
alter table items enable row level security;
alter table meals enable row level security;
alter table trips enable row level security;
alter table plano enable row level security;

-- Public access via trip_id (no auth required for collaboration)
create policy "Public items" on items for all using (true) with check (true);
create policy "Public meals" on meals for all using (true) with check (true);
create policy "Public trips" on trips for all using (true) with check (true);
create policy "Public plano" on plano for all using (true) with check (true);

-- ═══════════════════════════════════════════════
-- 7. REALTIME (subscribe to changes)
-- ═══════════════════════════════════════════════
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table meals;
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table plano;
