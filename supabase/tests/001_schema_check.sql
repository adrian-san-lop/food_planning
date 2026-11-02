-- Read-only structural checks for the complete schema described by current migrations.
-- Run after applying all migration files in Supabase SQL Editor.

do $$
declare
  table_name text;
  constraint_definition text;
  activity_level_default text;
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
  select pg_catalog.pg_get_constraintdef(oid, true) into constraint_definition
  from pg_catalog.pg_constraint
  where conrelid = 'public.profiles'::regclass
    and conname = 'profiles_activity_level_check';
  if constraint_definition is null
     or position('very_sedentary' in constraint_definition) = 0
     or position('sedentary' in constraint_definition) = 0
     or position('light' in constraint_definition) = 0
     or position('moderate' in constraint_definition) = 0
     or position('intense' in constraint_definition) = 0
     or position('very_intense' in constraint_definition) = 0 then
    raise exception 'The six supported profile movement levels must be constrained in Supabase';
  end if;

  select column_default into activity_level_default
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'activity_level';
  if activity_level_default is distinct from '''sedentary''::text' then
    raise exception 'New profiles must default to the sedentary movement level';
  end if;

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
    raise exception 'Meal completion shortfalls must remain read-only for the app role';
  end if;

  if has_table_privilege('authenticated', 'public.meal_completion_shortfalls', 'insert') then
    raise exception 'The app role must not insert retired meal completion shortfalls';
  end if;

  if exists (select 1 from public.meal_completion_shortfalls) then
    raise exception 'Retired meal completion shortfall rows must be purged';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger t
    where t.tgrelid = 'public.meal_completion_shortfalls'::regclass
      and t.tgname = 'discard_retired_meal_shortfall'
      and not t.tgisinternal
      and t.tgenabled <> 'D'
  ) then
    raise exception 'Retired meal shortfall writes must be suppressed';
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
