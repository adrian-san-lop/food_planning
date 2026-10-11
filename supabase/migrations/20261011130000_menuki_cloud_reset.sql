-- Add an explicit, user-confirmed full-state replacement for Menuki.
-- The client calls this only for "reset all" or an explicit JSON restore.
-- Deletes and the replacement snapshot commit in the same transaction.

begin;

create or replace function public.reset_menuki_state(
  p_snapshot jsonb,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.user_settings%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  insert into public.user_settings (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_settings
  from public.user_settings
  where user_id = v_user_id
  for update;

  if v_settings.sync_revision <> coalesce(p_expected_revision, -1) then
    raise exception using errcode = '40001', message = 'SYNC_CONFLICT';
  end if;

  -- Remove dependent rows first, preserving transactionality with the new snapshot.
  delete from public.shopping_session_items where user_id = v_user_id;
  delete from public.shopping_sessions where user_id = v_user_id;
  delete from public.prep_tasks where user_id = v_user_id;
  delete from public.meal_completion_ingredients where user_id = v_user_id;
  delete from public.inventory_movements
  where user_id = v_user_id and movement_kind = 'reversal';
  delete from public.inventory_movements where user_id = v_user_id;
  delete from public.meal_completions where user_id = v_user_id;
  delete from public.planned_meals where user_id = v_user_id;
  update public.plan_cycles
  set supersedes_cycle_id = null
  where user_id = v_user_id and supersedes_cycle_id is not null;
  delete from public.plan_cycles where user_id = v_user_id;
  delete from public.weight_logs where user_id = v_user_id;
  delete from public.activity_sessions where user_id = v_user_id;
  delete from public.training_logs where user_id = v_user_id;

  -- Reuse the regular validator/writer while retaining the same locked revision.
  return public.sync_menuki_state(p_snapshot, p_expected_revision);
end;
$$;

revoke all on function public.reset_menuki_state(jsonb, bigint) from public, anon;
grant execute on function public.reset_menuki_state(jsonb, bigint) to authenticated;

commit;
