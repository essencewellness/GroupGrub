-- Migration 002: Add pessoas + plano to trips for full cloud persistence
-- Fixes: plano and meta were localStorage-only — lost after browser clear / iOS wipe

alter table trips
  add column if not exists pessoas jsonb default '[]',
  add column if not exists plano   jsonb default '{}';
