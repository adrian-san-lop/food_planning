-- Package 4. Additive schema and complete RPC definitions, with no function-body
-- rewriting. Apply before enabling preferences/guided signup in a deployed UI.
begin;

alter table public.user_settings add column if not exists setup_mode text not null default 'legacy'
  check (setup_mode in ('legacy', 'guided'));

-- An unused manual estimate can be absent when sex is male/female. Confirmed
-- manual-mode profiles still require it in the RPC validator below.
alter table public.profiles alter column manual_rmr_kcal drop not null;

create table if not exists public.profile_setup_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  draft_version smallint not null default 1 check (draft_version = 1),
  sex text check (sex in ('male', 'female', 'manual')),
  age smallint check (age between 18 and 95),
  height_cm numeric(5,1) check (height_cm between 125 and 220),
  reference_weight_kg numeric(5,1) check (reference_weight_kg between 35 and 250),
  activity_level text check (activity_level in ('very_sedentary','sedentary','light','moderate','intense','very_intense')),
  goal text check (goal in ('maintain','recomp','fat_loss','muscle_gain')),
  manual_rmr_kcal smallint check (manual_rmr_kcal between 800 and 3500),
  injury_recovery boolean not null default false,
  auto_portions boolean not null default true,
  follow_weight boolean not null default false,
  preferences_reviewed boolean not null default false,
  start_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekday_lunch_max_minutes smallint check (weekday_lunch_max_minutes between 1 and 1440),
  weekday_dinner_max_minutes smallint check (weekday_dinner_max_minutes between 1 and 1440),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null check (recipe_id ~ '^[a-z][a-zA-Z0-9_]*$'),
  preference text not null check (preference in ('normal','favorite','do_not_propose')),
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

comment on table public.profile_setup_drafts is 'Private nullable form fields. Not a confirmed nutritional profile; sync initialization is independent of setup completion.';
comment on table public.recipe_preferences is 'Explicit recipe choices; normal is a durable reset marker, omitted keys do not delete preferences.';

alter table public.profile_setup_drafts enable row level security;
alter table public.menu_preferences enable row level security;
alter table public.recipe_preferences enable row level security;
drop policy if exists profile_setup_drafts_select_own on public.profile_setup_drafts;
create policy profile_setup_drafts_select_own on public.profile_setup_drafts for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists menu_preferences_select_own on public.menu_preferences;
create policy menu_preferences_select_own on public.menu_preferences for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists recipe_preferences_select_own on public.recipe_preferences;
create policy recipe_preferences_select_own on public.recipe_preferences for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.profile_setup_drafts, public.menu_preferences, public.recipe_preferences from public, anon, authenticated;
grant select on public.profile_setup_drafts, public.menu_preferences, public.recipe_preferences to authenticated;
-- Prevent direct writes bypassing setup/profile/plan validation. The app already
-- writes these tables exclusively through the transactional RPC.
revoke insert, update, delete on public.profiles, public.plan_cycles, public.planned_meals, public.user_settings from public, anon, authenticated;

create or replace function public.menuki_state_capabilities()
returns jsonb language sql stable security invoker set search_path = ''
as $capabilities$ select pg_catalog.jsonb_build_object('planning_contract', 1) $capabilities$;
revoke all on function public.menuki_state_capabilities() from public, anon;
grant execute on function public.menuki_state_capabilities() to authenticated;

-- Strict types/ranges mirror profile.js. Draft fields may be null, confirmed
-- fields may not. No clamping/defaulting of required personal data.
create or replace function public.valid_menuki_profile(p jsonb, p_partial boolean default false)
returns boolean language plpgsql immutable set search_path = '' as $validator$
declare k text; n numeric; lo numeric; hi numeric;
begin
  if p is null or pg_catalog.jsonb_typeof(p) <> 'object' then return false; end if;
  foreach k in array array['sex','activity_level','goal'] loop
    if p -> k is null or p -> k = 'null'::jsonb then
      if p_partial then continue; else return false; end if;
    end if;
    if pg_catalog.jsonb_typeof(p -> k) <> 'string' then return false; end if;
    if k = 'sex' and p ->> k not in ('male','female','manual') then return false; end if;
    if k = 'activity_level' and p ->> k not in ('very_sedentary','sedentary','light','moderate','intense','very_intense') then return false; end if;
    if k = 'goal' and p ->> k not in ('maintain','recomp','fat_loss','muscle_gain') then return false; end if;
  end loop;
  foreach k in array array['age','height_cm','reference_weight_kg','manual_rmr_kcal'] loop
    if p -> k is null or p -> k = 'null'::jsonb then
      if p_partial or (k = 'manual_rmr_kcal' and p ->> 'sex' <> 'manual') then continue; else return false; end if;
    end if;
    if pg_catalog.jsonb_typeof(p -> k) <> 'number' then return false; end if;
    n := (p ->> k)::numeric;
    lo := case k when 'age' then 18 when 'height_cm' then 125 when 'reference_weight_kg' then 35 else 800 end;
    hi := case k when 'age' then 95 when 'height_cm' then 220 when 'reference_weight_kg' then 250 else 3500 end;
    if n < lo or n > hi or (k in ('age','manual_rmr_kcal') and n <> trunc(n)) then return false; end if;
  end loop;
  foreach k in array array['injury_recovery','auto_portions','follow_weight'] loop
    if pg_catalog.jsonb_typeof(p -> k) is distinct from 'boolean' then return false; end if;
  end loop;
  return true;
end;
$validator$;
revoke all on function public.valid_menuki_profile(jsonb,boolean) from public, anon, authenticated;

-- The full writers follow. Inventory triggers/constraints remain authoritative;
-- new RPCs do not insert into the retired shortfalls table.

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
  v_mode text;
  v_profile_ready boolean;
  v_field text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object'
     or jsonb_typeof(p_snapshot -> 'cycles') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'planned_meals') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'completions') is distinct from 'array'
     or jsonb_typeof(p_snapshot -> 'movements') is distinct from 'array' then
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
    raise sqlstate 'PT409' using message = 'SYNC_CONFLICT';
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
    or exists (select 1 from public.profile_setup_drafts where user_id = v_user_id)
    or exists (select 1 from public.menu_preferences where user_id = v_user_id)
    or exists (select 1 from public.recipe_preferences where user_id = v_user_id)
  ) then
    raise exception using errcode = '55000', message = 'REMOTE_DATA_EXISTS_RELOAD';
  end if;


  if p_snapshot ? 'planning_contract' and p_snapshot -> 'planning_contract' is distinct from '1'::jsonb then
    raise exception using errcode = '22023', message = 'Unsupported planning contract';
  end if;
  if v_settings.setup_mode = 'guided' and not (p_snapshot ? 'planning_contract') then
    raise exception using errcode = '22023', message = 'PLANNING_CLIENT_UPGRADE_REQUIRED';
  end if;
  v_mode := coalesce(p_snapshot ->> 'setup_mode', v_settings.setup_mode);
  if v_mode not in ('legacy','guided') or (v_settings.setup_mode = 'guided' and v_mode <> 'guided') then
    raise exception using errcode = '22023', message = 'Invalid setup mode';
  end if;
  if v_mode = 'guided' and not (p_snapshot ? 'planning_contract') then
    raise exception using errcode = '22023', message = 'Planning contract required';
  end if;
  if v_mode = 'guided' and p_snapshot -> 'profile' is distinct from 'null'::jsonb
     and (p_snapshot #> '{profile,profile_confirmed}') is distinct from 'true'::jsonb then
    raise exception using errcode = '22023', message = 'Use setup draft for incomplete profile';
  end if;
  if p_snapshot -> 'profile' is not null and p_snapshot -> 'profile' <> 'null'::jsonb then
    if p_snapshot -> 'profile' ? 'profile_confirmed'
       and pg_catalog.jsonb_typeof(p_snapshot #> '{profile,profile_confirmed}') is distinct from 'boolean' then
      raise exception using errcode = '22023', message = 'INVALID_PROFILE_CONFIRMATION';
    end if;
    if (v_mode = 'guided' or p_snapshot #> '{profile,profile_confirmed}' = 'true'::jsonb)
       and not public.valid_menuki_profile(p_snapshot -> 'profile') then
      raise exception using errcode = '22023', message = 'INVALID_CONFIRMED_PROFILE';
    end if;
    v_profile_ready := p_snapshot #> '{profile,profile_confirmed}' = 'true'::jsonb
      and public.valid_menuki_profile(p_snapshot -> 'profile');
  else
    select coalesce(profile_confirmed, false) into v_profile_ready
    from public.profiles where user_id = v_user_id;
  end if;
  for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> 'cycles') loop
    if v_item ->> 'status' in ('active','scheduled')
       and (v_mode = 'guided' or nullif(v_item ->> 'confirmed_at','') is not null)
       and not exists (select 1 from public.plan_cycles c where c.user_id = v_user_id
         and c.id = (v_item ->> 'id')::uuid and c.status in ('active','scheduled','archived')
         and (c.confirmed_at is not null or (v_mode = 'legacy' and nullif(v_item ->> 'confirmed_at','') is null)))
       and (not coalesce(v_profile_ready,false) or nullif(v_item ->> 'confirmed_at','') is null) then
      raise exception using errcode = '22023', message = 'CONFIRMED_PROFILE_REQUIRED';
    end if;
    if (select count(*) from pg_catalog.jsonb_array_elements(p_snapshot -> 'planned_meals') m
          where m ->> 'cycle_id' = v_item ->> 'id') <> 105
       or (select count(distinct (m ->> 'meal_date', m ->> 'slot'))
          from pg_catalog.jsonb_array_elements(p_snapshot -> 'planned_meals') m
          where m ->> 'cycle_id' = v_item ->> 'id'
            and (m ->> 'meal_date')::date between (v_item ->> 'start_date')::date and (v_item ->> 'start_date')::date + 20
            and (m ->> 'slot')::integer between 0 and 4) <> 105 then
      raise exception using errcode = '22023', message = 'INCOMPLETE_MENU_CYCLE';
    end if;
  end loop;

  if p_snapshot ? 'setup_draft' then
    v_item := p_snapshot -> 'setup_draft';
    if pg_catalog.jsonb_typeof(v_item) is distinct from 'object'
       or not (v_item ?& array['draft_version','sex','age','height_cm','reference_weight_kg','activity_level','goal','manual_rmr_kcal','injury_recovery','auto_portions','follow_weight','preferences_reviewed','start_date'])
       or v_item - array['draft_version','sex','age','height_cm','reference_weight_kg','activity_level','goal','manual_rmr_kcal','injury_recovery','auto_portions','follow_weight','preferences_reviewed','start_date'] <> '{}'::jsonb
       or v_item -> 'draft_version' is distinct from '1'::jsonb
       or not public.valid_menuki_profile(v_item, true)
       or pg_catalog.jsonb_typeof(v_item -> 'preferences_reviewed') is distinct from 'boolean'
       or (v_item -> 'start_date' <> 'null'::jsonb and (pg_catalog.jsonb_typeof(v_item -> 'start_date') <> 'string' or v_item ->> 'start_date' !~ '^\d{4}-\d{2}-\d{2}$')) then
      raise exception using errcode = '22023', message = 'INVALID_SETUP_DRAFT';
    end if;
    insert into public.profile_setup_drafts(user_id,draft_version,sex,age,height_cm,reference_weight_kg,activity_level,goal,manual_rmr_kcal,injury_recovery,auto_portions,follow_weight,preferences_reviewed,start_date)
    values(v_user_id,1,v_item ->> 'sex',(v_item ->> 'age')::smallint,(v_item ->> 'height_cm')::numeric,(v_item ->> 'reference_weight_kg')::numeric,v_item ->> 'activity_level',v_item ->> 'goal',(v_item ->> 'manual_rmr_kcal')::smallint,(v_item ->> 'injury_recovery')::boolean,(v_item ->> 'auto_portions')::boolean,(v_item ->> 'follow_weight')::boolean,(v_item ->> 'preferences_reviewed')::boolean,(v_item ->> 'start_date')::date)
    on conflict(user_id) do update set sex=excluded.sex,age=excluded.age,height_cm=excluded.height_cm,reference_weight_kg=excluded.reference_weight_kg,activity_level=excluded.activity_level,goal=excluded.goal,manual_rmr_kcal=excluded.manual_rmr_kcal,injury_recovery=excluded.injury_recovery,auto_portions=excluded.auto_portions,follow_weight=excluded.follow_weight,preferences_reviewed=excluded.preferences_reviewed,start_date=excluded.start_date,updated_at=pg_catalog.now();
  end if;
  if p_snapshot ? 'menu_preferences' then
    v_item := p_snapshot -> 'menu_preferences';
    if pg_catalog.jsonb_typeof(v_item) is distinct from 'object' or v_item - array['weekday_lunch_max_minutes','weekday_dinner_max_minutes'] <> '{}'::jsonb then
      raise exception using errcode = '22023', message = 'INVALID_MENU_PREFERENCES';
    end if;
    foreach v_field in array array['weekday_lunch_max_minutes','weekday_dinner_max_minutes'] loop
      if v_item ? v_field and v_item -> v_field <> 'null'::jsonb then
        if pg_catalog.jsonb_typeof(v_item -> v_field) <> 'number' then
          raise exception using errcode = '22023', message = 'INVALID_TIME_LIMIT';
        end if;
        if (v_item ->> v_field)::numeric not between 1 and 1440 or (v_item ->> v_field)::numeric <> trunc((v_item ->> v_field)::numeric) then
          raise exception using errcode = '22023', message = 'INVALID_TIME_LIMIT';
        end if;
      end if;
    end loop;
    insert into public.menu_preferences(user_id,weekday_lunch_max_minutes,weekday_dinner_max_minutes)
    values(v_user_id,(v_item ->> 'weekday_lunch_max_minutes')::smallint,(v_item ->> 'weekday_dinner_max_minutes')::smallint)
    on conflict(user_id) do update set
      weekday_lunch_max_minutes=case when v_item ? 'weekday_lunch_max_minutes' then excluded.weekday_lunch_max_minutes else public.menu_preferences.weekday_lunch_max_minutes end,
      weekday_dinner_max_minutes=case when v_item ? 'weekday_dinner_max_minutes' then excluded.weekday_dinner_max_minutes else public.menu_preferences.weekday_dinner_max_minutes end,updated_at=pg_catalog.now();
  end if;
  if p_snapshot ? 'recipe_preferences' then
    if pg_catalog.jsonb_typeof(p_snapshot -> 'recipe_preferences') is distinct from 'array' then
      raise exception using errcode = '22023', message = 'INVALID_RECIPE_PREFERENCES';
    end if;
    for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> 'recipe_preferences') loop
      if pg_catalog.jsonb_typeof(v_item) is distinct from 'object'
         or not (v_item ?& array['recipe_id','preference'])
         or v_item - array['recipe_id','preference'] <> '{}'::jsonb
         or pg_catalog.jsonb_typeof(v_item -> 'recipe_id') <> 'string'
         or v_item ->> 'recipe_id' !~ '^[a-z][a-zA-Z0-9_]*$'
         or v_item ->> 'preference' not in ('normal','favorite','do_not_propose') then
        raise exception using errcode = '22023', message = 'INVALID_RECIPE_PREFERENCE';
      end if;
      insert into public.recipe_preferences(user_id,recipe_id,preference)
      values(v_user_id,v_item ->> 'recipe_id',v_item ->> 'preference')
      on conflict(user_id,recipe_id) do update set preference=excluded.preference,updated_at=pg_catalog.now();
    end loop;
  end if;
  update public.user_settings set setup_mode=v_mode where user_id=v_user_id;

  if p_snapshot -> 'profile' is not null and p_snapshot -> 'profile' <> 'null'::jsonb then
  insert into public.profiles (
    user_id, sex, age, height_cm, reference_weight_kg, activity_level,
    training_bonus_kcal, goal, injury_recovery, auto_portions,
    follow_weight, manual_rmr_kcal, profile_confirmed, updated_at
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
    coalesce((p_snapshot #>> '{profile,profile_confirmed}')::boolean, false),
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
    profile_confirmed = case
      when p_snapshot #> '{profile,profile_confirmed}' is null
        then public.profiles.profile_confirmed
      else excluded.profile_confirmed
    end,
    updated_at = pg_catalog.now();

  end if; -- optional confirmed profile

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
      v_reverses_movement_id, 0,
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
    raise sqlstate 'PT409' using message = 'SYNC_CONFLICT';
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

  delete from public.profile_setup_drafts where user_id = v_user_id;
  delete from public.menu_preferences where user_id = v_user_id;
  delete from public.recipe_preferences where user_id = v_user_id;
  delete from public.profiles where user_id = v_user_id;
  update public.user_settings set setup_mode = 'legacy' where user_id = v_user_id;

  -- Reuse the regular validator/writer while retaining the same locked revision.
  return public.sync_menuki_state(p_snapshot, p_expected_revision);
end;
$$;

revoke all on function public.reset_menuki_state(jsonb, bigint) from public, anon;
grant execute on function public.reset_menuki_state(jsonb, bigint) to authenticated;


notify pgrst, 'reload schema';
commit;
