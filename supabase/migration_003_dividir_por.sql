-- Migration 003: Ensure expenses.dividir_por column exists
-- Handles all states the live DB can be in:
--   A) participantes exists → rename it
--   B) neither column exists → add dividir_por
--   C) dividir_por already exists → no-op

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'expenses' and column_name = 'participantes'
  ) then
    alter table expenses rename column participantes to dividir_por;
  elsif not exists (
    select 1 from information_schema.columns
    where table_name = 'expenses' and column_name = 'dividir_por'
  ) then
    alter table expenses add column dividir_por jsonb default '[]';
  end if;
end $$;
