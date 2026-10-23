-- Read-only deployment checks. Run AFTER applying package 4. Every ready value
-- must be true. This is structural evidence, not an authenticated-device test.
select 'three_new_tables_rls' as check_name,
  count(*) = 3 and bool_and(c.relrowsecurity) as ready
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profile_setup_drafts','menu_preferences','recipe_preferences');

select 'planning_tables_read_only_for_browser' as check_name,
  count(*) = 3 and bool_and(
    has_table_privilege('authenticated', c.oid, 'SELECT')
    and not has_table_privilege('authenticated', c.oid, 'INSERT,UPDATE,DELETE')
    and not has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
  ) as ready
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profile_setup_drafts','menu_preferences','recipe_preferences');

select 'profile_and_plan_rpc_only' as check_name,
  count(*) = 4 and bool_and(not has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE')) as ready
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('profiles','plan_cycles','planned_meals','user_settings');

select 'own_read_policies' as check_name, count(*) = 3 as ready
from pg_policies where schemaname='public'
  and tablename in ('profile_setup_drafts','menu_preferences','recipe_preferences')
  and cmd='SELECT' and qual like '%auth.uid()%';

select 'capability_v1' as check_name,
  public.menuki_state_capabilities() -> 'planning_contract' = '1'::jsonb as ready;

select 'transactional_sync_definition' as check_name,
  position('profile_setup_drafts' in pg_get_functiondef('public.sync_menuki_state(jsonb,bigint)'::regprocedure)) > 0
  and position('CONFIRMED_PROFILE_REQUIRED' in pg_get_functiondef('public.sync_menuki_state(jsonb,bigint)'::regprocedure)) > 0
  and position('PT409' in pg_get_functiondef('public.sync_menuki_state(jsonb,bigint)'::regprocedure)) > 0
  and position('insert into public.meal_completion_shortfalls' in pg_get_functiondef('public.sync_menuki_state(jsonb,bigint)'::regprocedure)) = 0 as ready;

select 'rpc_grants' as check_name,
  has_function_privilege('authenticated','public.sync_menuki_state(jsonb,bigint)','EXECUTE')
  and not has_function_privilege('anon','public.sync_menuki_state(jsonb,bigint)','EXECUTE')
  and not has_function_privilege('authenticated','public.valid_menuki_profile(jsonb,boolean)','EXECUTE') as ready;
