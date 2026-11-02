-- Read-only audit: identify the exact CHECK constraint rejecting a movement.
-- Safe to run in Supabase SQL Editor; returns definitions, not user data.
select
  conname as constraint_name,
  pg_catalog.pg_get_constraintdef(oid, true) as constraint_definition
from pg_catalog.pg_constraint
where conrelid = 'public.inventory_movements'::regclass
  and contype = 'c'
order by conname;
