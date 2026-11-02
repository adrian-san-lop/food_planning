-- Read-only deployment checks. Expected: eight rows with ready = true.
select 'account_contract_2' check_name,
  public.menuki_state_capabilities()->>'account_contract' = '2' ready
union all
select 'account_contract_column', exists(select 1 from information_schema.columns where table_schema='public' and table_name='user_settings' and column_name='account_contract')
union all
select 'snapshot_tables_rls', count(*)=5 and bool_and(c.relrowsecurity)
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
    and c.relname in ('plan_recipe_snapshots','plan_recipe_ingredients','planned_meal_portions','plan_day_targets','menuki_account_operations')
union all
select 'snapshot_tables_read_only', bool_and(not has_table_privilege('authenticated','public.'||t,'INSERT')
  and not has_table_privilege('authenticated','public.'||t,'UPDATE') and not has_table_privilege('authenticated','public.'||t,'DELETE')
  and not has_table_privilege('anon','public.'||t,'SELECT'))
  from unnest(array['plan_recipe_snapshots','plan_recipe_ingredients','planned_meal_portions','plan_day_targets','menuki_account_operations']) t
union all
select 'atomic_reader', p.provolatile='s' and p.prosecdef and pg_get_functiondef(p.oid) like '%auth.uid()%'
  from pg_proc p where p.oid='public.get_menuki_state()'::regprocedure
union all
select 'scoped_action_guards', p.prosecdef and pg_get_functiondef(p.oid) like '%OPERATION_ID_REUSED%'
  and pg_get_functiondef(p.oid) like '%SYNC_CONFLICT%' and pg_get_functiondef(p.oid) like '%INCOMPLETE_PLAN_DETAILS%'
  and pg_get_functiondef(p.oid) like '%COMPLETED_QUANTITY_IMMUTABLE%'
  from pg_proc p where p.oid='public.apply_menuki_action(jsonb,bigint,uuid)'::regprocedure
union all
select 'rpc_permissions', has_function_privilege('authenticated','public.get_menuki_state()','EXECUTE')
  and has_function_privilege('authenticated','public.apply_menuki_action(jsonb,bigint,uuid)','EXECUTE')
  and not has_function_privilege('anon','public.get_menuki_state()','EXECUTE')
  and not has_function_privilege('anon','public.apply_menuki_action(jsonb,bigint,uuid)','EXECUTE')
  and not has_function_privilege('authenticated','public.advance_due_menuki_cycle()','EXECUTE')
union all
select 'old_client_guard', pg_get_functiondef('public.sync_menuki_state(jsonb,bigint)'::regprocedure) like '%ACCOUNT_CLIENT_UPGRADE_REQUIRED%';
