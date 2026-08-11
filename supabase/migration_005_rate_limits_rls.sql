-- Migration 005: Enable RLS on rate_limits table
-- rate_limits is written by verify-session Edge Function (service_role only).
-- Anon key should never touch this table directly.

-- Create the table if it doesn't exist yet (idempotent)
create table if not exists rate_limits (
  id       uuid primary key default gen_random_uuid(),
  ip       text not null,
  hit_at   timestamptz not null default now()
);

create index if not exists idx_rate_limits_ip_hit on rate_limits (ip, hit_at);

-- Enable RLS (no-op if already enabled, safe to run twice)
alter table rate_limits enable row level security;

-- Drop any accidental open policies first
drop policy if exists "public rate_limits" on rate_limits;

-- Only service_role (Edge Functions) can read or write
create policy "service only rate_limits"
  on rate_limits for all
  to service_role
  using (true) with check (true);
