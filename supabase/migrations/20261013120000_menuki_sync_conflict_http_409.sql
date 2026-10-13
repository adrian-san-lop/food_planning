-- PostgREST 14 retries RPC transactions that raise SQLSTATE 40001.
-- Replace only the stale-revision exception in the two existing RPCs and
-- preserve their deployed bodies, ownership, settings, and grants.
begin;

do $migration$
declare
  v_signature regprocedure;
  v_definition text;
  v_updated_definition text;
  v_old_conflict_pattern constant text :=
    'raise[[:space:]]+exception[[:space:]]+using[[:space:]]+errcode[[:space:]]*=[[:space:]]*''40001''[[:space:]]*,[[:space:]]*message[[:space:]]*=[[:space:]]*''SYNC_CONFLICT''[[:space:]]*;';
  v_new_conflict_pattern constant text :=
    'raise[[:space:]]+sqlstate[[:space:]]+''PT409''[[:space:]]+using[[:space:]]+message[[:space:]]*=[[:space:]]*''SYNC_CONFLICT''[[:space:]]*;';
  v_new_conflict_sql constant text :=
    'raise sqlstate ''PT409'' using message = ''SYNC_CONFLICT'';';
begin
  foreach v_signature in array array[
    'public.sync_menuki_state(jsonb,bigint)'::regprocedure,
    'public.reset_menuki_state(jsonb,bigint)'::regprocedure
  ] loop
    v_definition := pg_get_functiondef(v_signature);

    -- Make the migration safe to retry if SQL Editor returned an unknown result.
    if v_definition ~* v_new_conflict_pattern then
      if v_definition ~* v_old_conflict_pattern then
        raise exception 'Mixed SYNC_CONFLICT SQLSTATEs found in %', v_signature;
      end if;
      continue;
    end if;

    if v_definition !~* v_old_conflict_pattern then
      raise exception 'Expected SYNC_CONFLICT SQLSTATE 40001 in %', v_signature;
    end if;

    v_updated_definition := regexp_replace(
      v_definition,
      v_old_conflict_pattern,
      v_new_conflict_sql,
      'gi'
    );

    if v_updated_definition = v_definition
       or v_updated_definition ~* v_old_conflict_pattern then
      raise exception 'Could not safely update SYNC_CONFLICT SQLSTATE in %', v_signature;
    end if;

    -- pg_get_functiondef returns a complete CREATE FUNCTION statement.
    v_updated_definition := regexp_replace(v_updated_definition, ';[[:space:]]*$', '');
    execute v_updated_definition;
  end loop;
end
$migration$;

commit;
