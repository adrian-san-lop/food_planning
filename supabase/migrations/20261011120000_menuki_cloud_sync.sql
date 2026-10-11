-- Add transactional, revision-checked synchronization for the Menuki client.
-- The JSON argument is transport only; personal records are stored in the
-- existing normalized tables. This migration does not remove or rewrite rows.

begin;

alter table public.user_settings
  add column if not exists state_initialized_at timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_revision bigint not null default 0;

alter table public.plan_cycles
  add column if not exists recovery_focus boolean not null default false,
  add column if not exists archived_at timestamptz;

alter table public.activity_sessions
  add column if not exists client_id text;
update public.activity_sessions set client_id = id::text where client_id is null;
create unique index if not exists activity_sessions_user_client_id_idx
  on public.activity_sessions (user_id, client_id);

comment on column public.user_settings.state_initialized_at is
  'Set after the first complete client-state import; prevents an empty or partial device from overwriting an initialized account.';
comment on column public.user_settings.sync_revision is
  'Monotonic compare-and-swap revision used to reject stale writes from another device.';
comment on column public.plan_cycles.recovery_focus is
  'Whether the qualitative bone-recovery menu preference was active when this cycle was proposed.';
comment on column public.plan_cycles.archived_at is
  'When the app moved this cycle into its local archive.';

create or replace function public.sync_menuki_state(
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
  v_item jsonb;
  v_child jsonb;
  v_completion_id uuid;
  v_source_completion_id uuid;
  v_reverses_movement_id uuid;
  v_shopping_id uuid;
  v_next_revision bigint;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object'
     or jsonb_typeof(p_snapshot -> 'cycles') <> 'array'
     or jsonb_typeof(p_snapshot -> 'planned_meals') <> 'array'
     or jsonb_typeof(p_snapshot -> 'completions') <> 'array'
     or jsonb_typeof(p_snapshot -> 'movements') <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid Menuki snapshot';
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

  if v_settings.state_initialized_at is null and (
    exists (select 1 from public.profiles where user_id = v_user_id)
    or exists (select 1 from public.plan_cycles where user_id = v_user_id)
    or exists (select 1 from public.planned_meals where user_id = v_user_id)
    or exists (select 1 from public.meal_completions where user_id = v_user_id)
    or exists (select 1 from public.inventory_movements where user_id = v_user_id)
    or exists (select 1 from public.weight_logs where user_id = v_user_id)
    or exists (select 1 from public.training_logs where user_id = v_user_id)
    or exists (select 1 from public.activity_sessions where user_id = v_user_id)
    or exists (select 1 from public.prep_tasks where user_id = v_user_id)
    or exists (select 1 from public.shopping_sessions where user_id = v_user_id)
    or exists (select 1 from public.shopping_session_items where user_id = v_user_id)
  ) then
    raise exception using errcode = '55000', message = 'REMOTE_DATA_EXISTS_RELOAD';
  end if;

  insert into public.profiles (
    user_id, sex, age, height_cm, reference_weight_kg, activity_level,
    training_bonus_kcal, goal, injury_recovery, auto_portions,
    follow_weight, manual_rmr_kcal, updated_at
  ) values (
    v_user_id,
    p_snapshot #>> '{profile,sex}',
    (p_snapshot #>> '{profile,age}')::smallint,
    (p_snapshot #>> '{profile,height_cm}')::numeric(5,1),
    (p_snapshot #>> '{profile,reference_weight_kg}')::numeric(5,1),
    p_snapshot #>> '{profile,activity_level}',
    0,
    p_snapshot #>> '{profile,goal}',
    coalesce((p_snapshot #>> '{profile,injury_recovery}')::boolean, false),
    coalesce((p_snapshot #>> '{profile,auto_portions}')::boolean, true),
    coalesce((p_snapshot #>> '{profile,follow_weight}')::boolean, false),
    (p_snapshot #>> '{profile,manual_rmr_kcal}')::smallint,
    pg_catalog.now()
  )
  on conflict (user_id) do update set
    sex = excluded.sex,
    age = excluded.age,
    height_cm = excluded.height_cm,
    reference_weight_kg = excluded.reference_weight_kg,
    activity_level = excluded.activity_level,
    training_bonus_kcal = 0,
    goal = excluded.goal,
    injury_recovery = excluded.injury_recovery,
    auto_portions = excluded.auto_portions,
    follow_weight = excluded.follow_weight,
    manual_rmr_kcal = excluded.manual_rmr_kcal,
    updated_at = pg_catalog.now();

  -- Retire singleton cycle statuses before upserting the current snapshot so
  -- the partial unique indexes remain valid when a draft/menu is replaced.
  update public.plan_cycles c
  set status = 'archived', archived_at = coalesce(c.archived_at, pg_catalog.now())
  where c.user_id = v_user_id and c.status = 'active'
    and not exists (
      select 1 from pg_catalog.jsonb_array_elements(p_snapshot -> 'cycles') x(value)
      where x.value ->> 'id' = c.id::text and x.value ->> 'status' = 'active'
    );
  update public.plan_cycles c
  set status = 'superseded'
  where c.user_id = v_user_id and c.status in ('draft', 'scheduled')
    and not exists (
      select 1 from pg_catalog.jsonb_array_elements(p_snapshot -> 'cycles') x(value)
      where x.value ->> 'id' = c.id::text and x.value ->> 'status' = c.status
    );

  for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> 'cycles')
  loop
    insert into public.plan_cycles (
      id, user_id, start_date, status, catalog_version, generated_at,
      confirmed_at, recovery_focus, archived_at
    ) values (
      (v_item ->> 'id')::uuid, v_user_id, (v_item ->> 'start_date')::date,
      v_item ->> 'status', coalesce(v_item ->> 'catalog_version', 'unknown'),
      nullif(v_item ->> 'generated_at', '')::timestamptz,
      nullif(v_item ->> 'confirmed_at', '')::timestamptz,
      coalesce((v_item ->> 'recovery_focus')::boolean, false),
      nullif(v_item ->> 'archived_at', '')::timestamptz
    )
    on conflict (id) do update set
      start_date = excluded.start_date,
      status = excluded.status,
      catalog_version = excluded.catalog_version,
      generated_at = excluded.generated_at,
      confirmed_at = excluded.confirmed_at,
      recovery_focus = excluded.recovery_focus,
      archived_at = coalesce(excluded.archived_at, public.plan_cycles.archived_at)
    where public.plan_cycles.user_id = v_user_id;
  end loop;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> 'planned_meals')
  loop
    insert into public.planned_meals (
      id, user_id, cycle_id, meal_date, slot, recipe_id, is_locked
    ) values (
      (v_item ->> 'id')::uuid, v_user_id, (v_item ->> 'cycle_id')::uuid,
      (v_item ->> 'meal_date')::date, (v_item ->> 'slot')::smallint,
      v_item ->> 'recipe_id', coalesce((v_item ->> 'is_locked')::boolean, false)
    )
    on conflict (id) do update set
      cycle_id = excluded.cycle_id,
      meal_date = excluded.meal_date,
      slot = excluded.slot,
      recipe_id = excluded.recipe_id,
      is_locked = excluded.is_locked
    where public.planned_meals.user_id = v_user_id;
  end loop;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> 'prep_tasks')
  loop
    insert into public.prep_tasks (
      user_id, cycle_id, week_index, task_key, is_completed, updated_at
    ) values (
      v_user_id, (v_item ->> 'cycle_id')::uuid,
      (v_item ->> 'week_index')::smallint, v_item ->> 'task_key',
      coalesce((v_item ->> 'is_completed')::boolean, false), pg_catalog.now()
    )
    on conflict (cycle_id, week_index, task_key) do update set
      is_completed = excluded.is_completed,
      updated_at = pg_catalog.now();
  end loop;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> 'completions')
  loop
    insert into public.meal_completions (
      id, user_id, planned_meal_id, recipe_id_snapshot, catalog_version,
      operation_id, completed_at, reversed_at
    ) values (
      (v_item ->> 'id')::uuid, v_user_id,
      (v_item ->> 'planned_meal_id')::uuid,
      v_item ->> 'recipe_id_snapshot', coalesce(v_item ->> 'catalog_version', 'unknown'),
      v_item ->> 'operation_id', coalesce(nullif(v_item ->> 'completed_at', '')::timestamptz, pg_catalog.now()),
      nullif(v_item ->> 'reversed_at', '')::timestamptz
    )
    on conflict (user_id, operation_id) do update set
      reversed_at = coalesce(public.meal_completions.reversed_at, excluded.reversed_at);

    select id into v_completion_id
    from public.meal_completions
    where user_id = v_user_id and operation_id = v_item ->> 'operation_id';

    for v_child in select value from pg_catalog.jsonb_array_elements(coalesce(v_item -> 'ingredients', '[]'::jsonb))
    loop
      insert into public.meal_completion_ingredients (
        completion_id, user_id, ingredient_index, food_id,
        ingredient_name_snapshot, quantity, recipe_unit
      ) values (
        v_completion_id, v_user_id, (v_child ->> 'ingredient_index')::smallint,
        v_child ->> 'food_id', v_child ->> 'ingredient_name_snapshot',
        (v_child ->> 'quantity')::numeric(14,4), v_child ->> 'recipe_unit'
      )
      on conflict (completion_id, ingredient_index) do nothing;
    end loop;
  end loop;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> 'movements')
  loop
    v_source_completion_id := null;
    v_reverses_movement_id := null;
    if v_item ->> 'movement_kind' = 'meal' then
      select id into v_source_completion_id
      from public.meal_completions
      where user_id = v_user_id and operation_id = v_item ->> 'completion_operation_id';
      if v_source_completion_id is null then
        raise exception using errcode = '23503', message = 'Missing meal completion for inventory movement';
      end if;
    elsif v_item ->> 'movement_kind' = 'reversal' then
      select id into v_reverses_movement_id
      from public.inventory_movements
      where user_id = v_user_id and operation_id = v_item ->> 'reverses_operation_id';
      if v_reverses_movement_id is null then
        raise exception using errcode = '23503', message = 'Missing original inventory movement for reversal';
      end if;
    end if;

    insert into public.inventory_movements (
      id, user_id, food_id, quantity, unit, movement_kind, operation_id,
      operation_group_id, source_completion_id, reverses_movement_id,
      shortfall_quantity, note, created_at
    ) values (
      (v_item ->> 'id')::uuid, v_user_id, v_item ->> 'food_id',
      (v_item ->> 'quantity')::numeric(14,4), v_item ->> 'unit',
      v_item ->> 'movement_kind', v_item ->> 'operation_id',
      nullif(v_item ->> 'operation_group_id', ''), v_source_completion_id,
      v_reverses_movement_id, coalesce((v_item ->> 'shortfall_quantity')::numeric(14,4), 0),
      v_item ->> 'note', coalesce(nullif(v_item ->> 'created_at', '')::timestamptz, pg_catalog.now())
    )
    on conflict (user_id, operation_id) do nothing;
  end loop;

  for v_item in select value from pg_catalog.jsonb_array_elements(coalesce(p_snapshot -> 'weights', '[]'::jsonb))
  loop
    insert into public.weight_logs (user_id, measured_on, weight_kg)
    values (v_user_id, (v_item ->> 'measured_on')::date, (v_item ->> 'weight_kg')::numeric(5,2))
    on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg;
  end loop;
  for v_item in select value from pg_catalog.jsonb_array_elements(coalesce(p_snapshot -> 'deleted_weight_dates', '[]'::jsonb))
  loop
    delete from public.weight_logs
    where user_id = v_user_id and measured_on = (v_item #>> '{}')::date;
  end loop;

  for v_item in select value from pg_catalog.jsonb_array_elements(coalesce(p_snapshot -> 'activity_sessions', '[]'::jsonb))
  loop
    insert into public.activity_sessions (
      id, user_id, client_id, session_date, activity_code, duration_minutes, met_value, created_at
    ) values (
      (v_item ->> 'id')::uuid, v_user_id, v_item ->> 'client_id',
      (v_item ->> 'session_date')::date,
      v_item ->> 'activity_code', (v_item ->> 'duration_minutes')::smallint,
      (v_item ->> 'met_value')::numeric(4,2),
      coalesce(nullif(v_item ->> 'created_at', '')::timestamptz, pg_catalog.now())
    )
    on conflict (user_id, client_id) do nothing;
  end loop;
  for v_item in select value from pg_catalog.jsonb_array_elements(coalesce(p_snapshot -> 'deleted_activity_ids', '[]'::jsonb))
  loop
    delete from public.activity_sessions
    where user_id = v_user_id and client_id = v_item #>> '{}';
  end loop;

  for v_item in select value from pg_catalog.jsonb_array_elements(coalesce(p_snapshot -> 'legacy_training_dates', '[]'::jsonb))
  loop
    insert into public.training_logs (user_id, training_date)
    values (v_user_id, (v_item #>> '{}')::date)
    on conflict (user_id, training_date) do nothing;
  end loop;

  v_shopping_id := (p_snapshot #>> '{shopping,id}')::uuid;
  update public.shopping_sessions
  set status = 'completed'
  where user_id = v_user_id and status = 'open' and id <> v_shopping_id;

  insert into public.shopping_sessions (
    id, user_id, window_key, starts_on, ends_on, status
  ) values (
    v_shopping_id, v_user_id, 'shared-cart',
    (p_snapshot #>> '{shopping,starts_on}')::date,
    (p_snapshot #>> '{shopping,ends_on}')::date, 'open'
  )
  on conflict (id) do update set
    window_key = excluded.window_key,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    status = 'open'
  where public.shopping_sessions.user_id = v_user_id;

  delete from public.shopping_session_items
  where user_id = v_user_id and session_id = v_shopping_id;

  for v_item in select value from pg_catalog.jsonb_array_elements(coalesce(p_snapshot #> '{shopping,items}', '[]'::jsonb))
  loop
    insert into public.shopping_session_items (
      id, user_id, session_id, item_key, food_id, item_kind,
      is_checked, package_count, package_size, unit
    ) values (
      (v_item ->> 'id')::uuid, v_user_id, v_shopping_id,
      v_item ->> 'item_key', v_item ->> 'food_id', v_item ->> 'item_kind',
      coalesce((v_item ->> 'is_checked')::boolean, false),
      (v_item ->> 'package_count')::numeric(12,3),
      (v_item ->> 'package_size')::numeric(14,4), v_item ->> 'unit'
    );
  end loop;

  update public.user_settings
  set last_backup_at = nullif(p_snapshot ->> 'last_backup_at', '')::date,
      state_initialized_at = coalesce(state_initialized_at, pg_catalog.now()),
      last_synced_at = pg_catalog.now(),
      sync_revision = sync_revision + 1,
      updated_at = pg_catalog.now()
  where user_id = v_user_id
  returning sync_revision into v_next_revision;

  return v_next_revision;
end;
$$;

revoke all on function public.sync_menuki_state(jsonb, bigint) from public, anon;
grant execute on function public.sync_menuki_state(jsonb, bigint) to authenticated;

commit;
