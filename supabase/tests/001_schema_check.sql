-- Read-only structural checks for the complete schema described by current migrations.
-- Run after applying all migration files in Supabase SQL Editor.

do $$
declare
  table_name text;
  constraint_definition text;
  required_tables text[] := array[
    'profiles',
    'plan_cycles',
    'planned_meals',
    'meal_completions',
    'meal_completion_ingredients',
    'meal_completion_shortfalls',
    'inventory_movements',
    'weight_logs',
    'training_logs',
    'prep_tasks',
    'shopping_sessions',
    'shopping_session_items',
    'user_settings',
    'activity_sessions'
  ];
begin
  foreach table_name in array required_tables
  loop
    if to_regclass(format('public.%I', table_name)) is null then
      raise exception 'Missing table public.%', table_name;
    end if;

    if not (
      select c.relrowsecurity
      from pg_class c
      where c.oid = to_regclass(format('public.%I', table_name))
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;

    if not exists (
      select 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = table_name
        and p.policyname = table_name || '_select_own'
    ) then
      raise exception 'Missing own-row SELECT policy on public.%', table_name;
    end if;

    if table_name <> 'meal_completion_shortfalls' and not exists (
      select 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = table_name
        and p.policyname = table_name || '_insert_own'
    ) then
      raise exception 'Missing own-row INSERT policy on public.%', table_name;
    end if;

    if has_table_privilege('anon', format('public.%I', table_name), 'select')
       or has_table_privilege('anon', format('public.%I', table_name), 'insert')
       or has_table_privilege('anon', format('public.%I', table_name), 'update')
       or has_table_privilege('anon', format('public.%I', table_name), 'delete') then
      raise exception 'Unauthenticated role still has access to public.%', table_name;
    end if;

    if not has_table_privilege('authenticated', format('public.%I', table_name), 'select') then
      raise exception 'Authenticated role has no SELECT grant on public.%', table_name;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.inventory_movements', 'update')
     or has_table_privilege('authenticated', 'public.inventory_movements', 'delete') then
    raise exception 'Inventory movements must remain append-only for the app role';
  end if;

  if has_table_privilege('authenticated', 'public.meal_completion_shortfalls', 'update')
     or has_table_privilege('authenticated', 'public.meal_completion_shortfalls', 'delete') then
    raise exception 'Meal completion shortfalls must remain append-only for the app role';
  end if;

  if has_table_privilege('authenticated', 'public.meal_completion_shortfalls', 'insert') then
    raise exception 'Meal completion shortfalls must be written only through the transactional sync RPC';
  end if;

  if has_table_privilege('authenticated', 'public.meal_completion_ingredients', 'update')
     or has_table_privilege('authenticated', 'public.meal_completion_ingredients', 'delete') then
    raise exception 'Meal completion ingredient snapshots must remain append-only for the app role';
  end if;

  select pg_catalog.pg_get_constraintdef(oid, true) into constraint_definition
  from pg_catalog.pg_constraint
  where conrelid = 'public.inventory_movements'::regclass
    and conname = 'inventory_movements_meal_quantity_check';
  if constraint_definition is null
     or position('quantity <= 0' in constraint_definition) = 0
     or position('quantity <> 0' in constraint_definition) = 0 then
    raise exception 'Meal inventory movements must allow zero markers and reject zero non-meal movements';
  end if;

  select pg_catalog.pg_get_constraintdef(oid, true) into constraint_definition
  from pg_catalog.pg_constraint
  where conrelid = 'public.inventory_movements'::regclass
    and conname = 'inventory_movements_meal_shortfall_check';
  if constraint_definition is null
     or position('source_completion_id IS NOT NULL' in constraint_definition) = 0
     or position('shortfall_quantity = 0' in constraint_definition) = 0 then
    raise exception 'Inventory movement shortfall/source constraint is missing or incomplete';
  end if;

  select pg_catalog.pg_get_constraintdef(oid, true) into constraint_definition
  from pg_catalog.pg_constraint
  where conrelid = 'public.inventory_movements'::regclass
    and conname = 'inventory_movements_check2';
  if constraint_definition is null
     or position('movement_kind = ''reversal''' in constraint_definition) = 0
     or position('reverses_movement_id IS NOT NULL' in constraint_definition) = 0 then
    raise exception 'Inventory reversal reference constraint must remain active';
  end if;

  raise notice 'Schema check passed: required tables, RLS, own-row policies, and grants are present.';
end
$$;
