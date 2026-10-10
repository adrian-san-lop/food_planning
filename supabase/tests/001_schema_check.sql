-- Read-only structural checks for the initial schema.
-- Run after applying the migration in Supabase SQL Editor.

do $$
declare
  table_name text;
  required_tables text[] := array[
    'profiles',
    'plan_cycles',
    'planned_meals',
    'meal_completions',
    'inventory_movements',
    'weight_logs',
    'training_logs',
    'prep_tasks',
    'shopping_sessions',
    'shopping_session_items',
    'user_settings'
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

    if not exists (
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

  raise notice 'Schema check passed: required tables, RLS, own-row policies, and grants are present.';
end
$$;
