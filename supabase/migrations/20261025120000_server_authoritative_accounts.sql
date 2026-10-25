-- Account contract 2. Relational storage; JSON is only the API transport.
begin;
alter table public.user_settings add column if not exists account_contract smallint not null default 1 check (account_contract in (1,2));

create table if not exists public.plan_recipe_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_id uuid not null,
  recipe_id text not null check (recipe_id ~ '^[a-z][a-zA-Z0-9_]*$'),
  name text not null check (length(name) between 1 and 240),
  meal_type text not null check (meal_type in ('desayuno','media','comida','tarde','cena')),
  time_minutes integer not null check (time_minutes between 0 and 1440),
  description text not null default '', tip text not null default '',
  steps text[] not null check (cardinality(steps) between 1 and 50),
  primary key (cycle_id,recipe_id,user_id),
  foreign key (cycle_id,user_id) references public.plan_cycles(id,user_id) on delete cascade
);
create table if not exists public.plan_recipe_ingredients (
  user_id uuid not null, cycle_id uuid not null, recipe_id text not null,
  ingredient_index integer not null check (ingredient_index between 0 and 99),
  food_id text not null check (food_id ~ '^[a-z][a-zA-Z0-9_]*$'),
  base_quantity numeric(14,4) not null check (base_quantity > 0),
  recipe_unit text not null check (recipe_unit in ('g','ml','ud')),
  -- Generic food metadata only, frozen for this recipe version; no account state.
  food_snapshot jsonb not null check (jsonb_typeof(food_snapshot) = 'object'
    and jsonb_typeof(food_snapshot->'food') = 'array'
    and jsonb_array_length(food_snapshot->'food') = 6
    and jsonb_typeof(food_snapshot->'meta') = 'object'
    and jsonb_typeof(food_snapshot->'purchase') = 'array' and jsonb_array_length(food_snapshot->'purchase')=3),
  primary key (cycle_id,recipe_id,ingredient_index,user_id),
  foreign key (cycle_id,recipe_id,user_id) references public.plan_recipe_snapshots(cycle_id,recipe_id,user_id) on delete cascade
);
create table if not exists public.planned_meal_portions (
  user_id uuid not null, planned_meal_id uuid not null,
  food_id text not null check (food_id ~ '^[a-z][a-zA-Z0-9_]*$'),
  quantity numeric(14,4) not null check (quantity >= 0 and quantity <= 1000000),
  primary key (planned_meal_id,food_id,user_id),
  foreign key (planned_meal_id,user_id) references public.planned_meals(id,user_id) on delete cascade
);
create table if not exists public.plan_day_targets (
  user_id uuid not null, cycle_id uuid not null, meal_date date not null,
  calculation_version text not null, input_signature text not null, event_signature text not null default '',
  target jsonb not null check (jsonb_typeof(target) = 'object'
    and target ?& array['calories','protein','carb','fat']
    and jsonb_typeof(target->'calories') = 'number'
    and (target->>'calories')::numeric > 0
    and jsonb_typeof(target->'protein') = 'number'
    and jsonb_typeof(target->'carb') = 'number'
    and jsonb_typeof(target->'fat') = 'number'
    and (target->>'protein')::numeric>=0 and (target->>'carb')::numeric>=0 and (target->>'fat')::numeric>=0),
  primary key (cycle_id,meal_date,user_id),
  foreign key (cycle_id,user_id) references public.plan_cycles(id,user_id) on delete cascade
);
create table if not exists public.menuki_account_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null, request_hash text not null,
  accepted_revision bigint not null, created_at timestamptz not null default now(),
  primary key (user_id,operation_id)
);
do $policies$
declare t text;
begin
  foreach t in array array['plan_recipe_snapshots','plan_recipe_ingredients','planned_meal_portions','plan_day_targets','menuki_account_operations'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    if t <> 'menuki_account_operations' then
      execute format('grant select on public.%I to authenticated',t);
      execute format('drop policy if exists own_read on public.%I',t);
      execute format('create policy own_read on public.%I for select to authenticated using (user_id = auth.uid())',t);
    end if;
  end loop;
end;
$policies$;

create or replace function public.menuki_state_capabilities()
returns jsonb language sql stable security definer set search_path = ''
as $$ select jsonb_build_object('planning_contract',1,'account_contract',2) $$;
revoke all on function public.menuki_state_capabilities() from public, anon;
grant execute on function public.menuki_state_capabilities() to authenticated;

-- A due confirmed cycle is effective on every device without a write on read.
create or replace function public.menuki_effective_cart_key(k text,kind text,starts date,confirmed timestamptz)
returns text language plpgsql immutable set search_path='' as $key$
declare scope text;
begin
 if starts is null then return k; end if;
 scope := 'next-'||starts::text||'-'||floor(extract(epoch from confirmed)*1000)::bigint::text;
 if kind='planned' then
  if left(k,length(scope)+1)=scope||'~' then return substr(k,length(scope)+2); end if;
  return null;
 end if;
 if cardinality(string_to_array(k,':'))=4 then
  if split_part(k,':',2)=scope then return 'extra:'||split_part(k,':',3)||':'||scope||'-'||split_part(k,':',4); end if;
  return null;
 end if;
 return k;
end;
$key$;
revoke all on function public.menuki_effective_cart_key(text,text,date,timestamptz) from public,anon,authenticated;

create or replace function public.advance_due_menuki_cycle()
returns void language plpgsql security definer set search_path='' as $advance$
declare due public.plan_cycles%rowtype; u uuid:=auth.uid();
begin
 select * into due from public.plan_cycles where user_id=u and status='scheduled' and confirmed_at is not null
   and start_date <= (now() at time zone 'Europe/Madrid')::date order by start_date desc,id limit 1;
 if not found then return; end if;
 update public.plan_cycles set status='archived',archived_at=coalesce(archived_at,due.start_date::timestamp at time zone 'Europe/Madrid') where user_id=u and status='active';
 update public.plan_cycles set status='active' where user_id=u and id=due.id;
 delete from public.shopping_session_items where user_id=u and session_id in (select id from public.shopping_sessions where user_id=u and status='open') and public.menuki_effective_cart_key(item_key,item_kind,due.start_date,due.confirmed_at) is null;
 update public.shopping_session_items set item_key=public.menuki_effective_cart_key(item_key,item_kind,due.start_date,due.confirmed_at) where user_id=u and session_id in (select id from public.shopping_sessions where user_id=u and status='open');
end;
$advance$;
revoke all on function public.advance_due_menuki_cycle() from public,anon,authenticated;

-- One SQL statement, one MVCC snapshot, including the account revision.
create or replace function public.get_menuki_state()
returns jsonb language sql stable security definer set search_path = ''
as $read$
with due as (select * from public.plan_cycles where user_id=auth.uid() and status='scheduled' and confirmed_at is not null and start_date <= (now() at time zone 'Europe/Madrid')::date order by start_date desc,id limit 1)
select jsonb_build_object(
 'accountContract',2,'planningSupported',true,
 'settings',(select to_jsonb(t) from public.user_settings t where user_id=auth.uid()),
 'profile',(select to_jsonb(t) from public.profiles t where user_id=auth.uid()),
 'setupDraft',(select to_jsonb(t) from public.profile_setup_drafts t where user_id=auth.uid()),
 'menuPreferences',(select to_jsonb(t) from public.menu_preferences t where user_id=auth.uid()),
 'recipePreferences',coalesce((select jsonb_agg(t order by recipe_id) from public.recipe_preferences t where user_id=auth.uid()),'[]'),
 'cycles',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('status',case when t.id=(select id from due) then 'active' when t.status='active' and exists(select 1 from due) then 'archived' else t.status end,'archived_at',case when t.status='active' and exists(select 1 from due) then coalesce(t.archived_at,(select start_date::timestamp at time zone 'Europe/Madrid' from due)) else t.archived_at end) order by t.id) from public.plan_cycles t where user_id=auth.uid()),'[]'),
 'plannedMeals',coalesce((select jsonb_agg(t order by id) from public.planned_meals t where user_id=auth.uid()),'[]'),
 'completions',coalesce((select jsonb_agg(t order by id) from public.meal_completions t where user_id=auth.uid()),'[]'),
 'ingredients',coalesce((select jsonb_agg(t order by completion_id,ingredient_index) from public.meal_completion_ingredients t where user_id=auth.uid()),'[]'),
 'movements',coalesce((select jsonb_agg(t order by created_at,id) from public.inventory_movements t where user_id=auth.uid()),'[]'),
 'weights',coalesce((select jsonb_agg(t order by measured_on) from public.weight_logs t where user_id=auth.uid()),'[]'),
 'activities',coalesce((select jsonb_agg(t order by id) from public.activity_sessions t where user_id=auth.uid()),'[]'),
 'training',coalesce((select jsonb_agg(t order by training_date) from public.training_logs t where user_id=auth.uid()),'[]'),
 'prep',coalesce((select jsonb_agg(t order by cycle_id,week_index,task_key) from public.prep_tasks t where user_id=auth.uid()),'[]'),
 'shoppingSessions',coalesce((select jsonb_agg(t order by id) from public.shopping_sessions t where user_id=auth.uid()),'[]'),
 'shoppingItems',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('item_key',k.effective_key) order by t.id) from public.shopping_session_items t join public.shopping_sessions s on s.id=t.session_id and s.user_id=t.user_id cross join lateral (select case when s.status='open' then public.menuki_effective_cart_key(t.item_key,t.item_kind,(select start_date from due),(select confirmed_at from due)) else t.item_key end effective_key) k where t.user_id=auth.uid() and k.effective_key is not null),'[]'),
 'planRecipes',coalesce((select jsonb_agg(t order by cycle_id,recipe_id) from public.plan_recipe_snapshots t where user_id=auth.uid()),'[]'),
 'planIngredients',coalesce((select jsonb_agg(t order by cycle_id,recipe_id,ingredient_index) from public.plan_recipe_ingredients t where user_id=auth.uid()),'[]'),
 'mealPortions',coalesce((select jsonb_agg(t order by planned_meal_id,food_id) from public.planned_meal_portions t where user_id=auth.uid()),'[]'),
 'dayTargets',coalesce((select jsonb_agg(t order by cycle_id,meal_date) from public.plan_day_targets t where user_id=auth.uid()),'[]')
) where auth.uid() is not null;
$read$;
revoke all on function public.get_menuki_state() from public, anon;
grant execute on function public.get_menuki_state() to authenticated;


-- Complete compatibility writer, no runtime body substitution.
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

  if v_settings.account_contract = 2 and pg_catalog.current_setting('menuki.account_action',true) is distinct from '2' then
    raise exception using errcode='22023',message='ACCOUNT_CLIENT_UPGRADE_REQUIRED';
  end if;

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

  -- Absence is never a delete/archive instruction. Only an explicit replacement
  -- of a singleton status retires its predecessor (also safe for old clients).
  update public.plan_cycles c
  set status = case when c.status = 'active' then 'archived' else 'superseded' end,
      archived_at = case when c.status = 'active' then coalesce(c.archived_at,pg_catalog.now()) else c.archived_at end
  where c.user_id = v_user_id and c.status in ('active','scheduled','draft')
    and exists (select 1 from pg_catalog.jsonb_array_elements(p_snapshot -> 'cycles') x
      where x ->> 'status' = c.status and x ->> 'id' <> c.id::text)
    and not exists (select 1 from pg_catalog.jsonb_array_elements(p_snapshot -> 'cycles') x
      where x ->> 'id' = c.id::text and x ->> 'status' = c.status);
  update public.plan_cycles c
  set status = x.value ->> 'status',
      archived_at = case when x.value ->> 'status' = 'archived' then coalesce(c.archived_at,pg_catalog.now()) else c.archived_at end
  from pg_catalog.jsonb_array_elements(p_snapshot -> 'cycles') x(value)
  where c.user_id=v_user_id and c.id::text=x.value->>'id'
    and x.value->>'status' in ('archived','superseded');

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

  if p_snapshot ? 'shopping' then
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

  end if;

  update public.user_settings
  set last_backup_at = case when p_snapshot ? 'last_backup_at' then nullif(p_snapshot ->> 'last_backup_at','')::date else last_backup_at end,
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



-- Scoped, idempotent mutations. The compatibility writer supplies existing
-- validation, revision locking and inventory triggers within this transaction.
create or replace function public.apply_menuki_action(p_action jsonb, p_expected_revision bigint, p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $action$
declare
 u uuid := auth.uid(); revision bigint; previous_hash text; request_hash text;
 payload jsonb; remote jsonb; item jsonb; shopping jsonb; items jsonb;
begin
 if u is null then raise exception using errcode='28000',message='Authentication required'; end if;
 if p_operation_id is null or p_action->>'contract' is distinct from '2'
    or jsonb_typeof(p_action) is distinct from 'object' then
  raise exception using errcode='22023',message='INVALID_ACCOUNT_ACTION';
 end if;
 if exists (select 1 from jsonb_object_keys(p_action) k where k not in
  ('contract','reset','profile','setup_draft','menu_preferences','setup_mode','planning_contract','cycles','planned_meals','prep_tasks','recipe_preferences',
   'completions','movements','weights','activity_sessions','deleted_weight_dates','deleted_activity_ids','shopping','retired_cycles',
   'plan_recipes','plan_ingredients','meal_portions','day_targets')) then
  raise exception using errcode='22023',message='UNKNOWN_ACTION_FIELD';
 end if;
 insert into public.user_settings(user_id) values(u) on conflict(user_id) do nothing;
 select sync_revision into revision from public.user_settings where user_id=u for update;
 request_hash := md5(p_action::text);
 select o.request_hash into previous_hash from public.menuki_account_operations o where user_id=u and operation_id=p_operation_id;
 if found then
  if previous_hash <> request_hash then raise exception using errcode='22023',message='OPERATION_ID_REUSED'; end if;
  return public.get_menuki_state();
 end if;
 if revision <> coalesce(p_expected_revision,-1) then raise sqlstate 'PT409' using message='SYNC_CONFLICT'; end if;
 perform public.advance_due_menuki_cycle();
 remote := public.get_menuki_state();
 payload := jsonb_build_object('planning_contract',1,'profile','null'::jsonb,'cycles','[]'::jsonb,'planned_meals','[]'::jsonb,'completions','[]'::jsonb,'movements','[]'::jsonb,'prep_tasks','[]'::jsonb)
  || (p_action - array['contract','reset','shopping','retired_cycles','plan_recipes','plan_ingredients','meal_portions','day_targets']);
 if p_action ? 'profile' then payload := jsonb_set(payload,'{profile}',coalesce(nullif(remote->'profile','null'::jsonb),'{}'::jsonb)||(p_action->'profile')); end if;
 if p_action ? 'setup_draft' then payload := jsonb_set(payload,'{setup_draft}',coalesce(nullif(remote->'setupDraft','null'::jsonb),'{}'::jsonb)||(p_action->'setup_draft')); end if;
 if p_action ? 'menu_preferences' then payload := jsonb_set(payload,'{menu_preferences}',coalesce(nullif(remote->'menuPreferences','null'::jsonb),'{}'::jsonb)||(p_action->'menu_preferences')); end if;
 -- Existing relational rows contain audit/identity columns, not writable fields.
 if payload ? 'setup_draft' then payload := jsonb_set(payload,'{setup_draft}',(payload->'setup_draft')-array['user_id','created_at','updated_at']); end if;
 if payload ? 'menu_preferences' then payload := jsonb_set(payload,'{menu_preferences}',(payload->'menu_preferences')-array['user_id','created_at','updated_at']); end if;
 for item in select value from jsonb_array_elements(coalesce(p_action->'retired_cycles','[]')) loop
  if item->>'status' not in ('archived','superseded') then raise exception using errcode='22023',message='INVALID_CYCLE_TRANSITION'; end if;
  update public.plan_cycles set status=item->>'status',archived_at=case when item->>'status'='archived' then coalesce(archived_at,now()) else archived_at end
   where user_id=u and id=(item->>'id')::uuid;
 end loop;
 if p_action ? 'shopping' then
  shopping := p_action->'shopping';
  select coalesce(jsonb_agg(to_jsonb(t)-array['user_id','session_id','created_at','updated_at']),'[]') into items
   from public.shopping_session_items t join public.shopping_sessions s on s.id=t.session_id and s.user_id=t.user_id
   where t.user_id=u and s.status='open'
    and not exists(select 1 from jsonb_array_elements_text(coalesce(shopping->'remove','[]')) x where x=t.item_key)
    and not exists(select 1 from jsonb_array_elements(coalesce(shopping->'upsert','[]')) x where x->>'item_key'=t.item_key);
  payload := jsonb_set(payload,'{shopping}',(shopping-array['upsert','remove'])||jsonb_build_object('items',items||coalesce(shopping->'upsert','[]')));
 end if;
 perform pg_catalog.set_config('menuki.account_action','2',true);
 if p_action->'reset' = 'true'::jsonb then
  revision := public.reset_menuki_state(payload,p_expected_revision);
 else revision := public.sync_menuki_state(payload,p_expected_revision); end if;
 for item in select value from jsonb_array_elements(coalesce(p_action->'plan_recipes','[]')) loop
  insert into public.plan_recipe_snapshots(user_id,cycle_id,recipe_id,name,meal_type,time_minutes,description,tip,steps)
   values(u,(item->>'cycle_id')::uuid,item->>'recipe_id',item->>'name',item->>'meal_type',(item->>'time_minutes')::integer,
    coalesce(item->>'description',''),coalesce(item->>'tip',''),array(select jsonb_array_elements_text(item->'steps')))
   on conflict(cycle_id,recipe_id,user_id) do update set name=excluded.name,meal_type=excluded.meal_type,time_minutes=excluded.time_minutes,
    description=excluded.description,tip=excluded.tip,steps=excluded.steps;
 end loop;
 delete from public.plan_recipe_ingredients t where user_id=u and exists(select 1 from jsonb_array_elements(coalesce(p_action->'plan_ingredients','[]')) x
   where (x->>'cycle_id')::uuid=t.cycle_id and x->>'recipe_id'=t.recipe_id);
 for item in select value from jsonb_array_elements(coalesce(p_action->'plan_ingredients','[]')) loop
  if item#>>'{food_snapshot,food,1}' is distinct from item->>'recipe_unit'
    or item#>>'{food_snapshot,meta,recipeUnit}' is distinct from item->>'recipe_unit'
    or item#>>'{food_snapshot,meta,unit}' not in ('g','ml','ud')
    or item#>>'{food_snapshot,purchase,0}' not in ('merc','fruit')
    or jsonb_typeof(item#>'{food_snapshot,purchase,1}') is distinct from 'string'
    or jsonb_typeof(item#>'{food_snapshot,purchase,2}') is distinct from 'number'
    or (item#>>'{food_snapshot,purchase,2}')::numeric<=0
    or jsonb_typeof(item#>'{food_snapshot,food,0}') is distinct from 'string'
    or item#>>'{food_snapshot,food,1}' not in ('g','ml','ud')
    or exists(select 1 from jsonb_array_elements(item#>'{food_snapshot,food}') with ordinality x(value,n)
      where n between 3 and 6 and (jsonb_typeof(value)<>'number' or (value#>>'{}')::numeric<0)) then
   raise exception using errcode='22023',message='INVALID_FOOD_SNAPSHOT';
  end if;
  insert into public.plan_recipe_ingredients(user_id,cycle_id,recipe_id,ingredient_index,food_id,base_quantity,recipe_unit,food_snapshot)
   values(u,(item->>'cycle_id')::uuid,item->>'recipe_id',(item->>'ingredient_index')::integer,item->>'food_id',
    (item->>'base_quantity')::numeric,item->>'recipe_unit',item->'food_snapshot');
 end loop;
 delete from public.planned_meal_portions t where user_id=u and exists(select 1 from jsonb_array_elements(coalesce(p_action->'meal_portions','[]')) x
   where (x->>'planned_meal_id')::uuid=t.planned_meal_id);
 for item in select value from jsonb_array_elements(coalesce(p_action->'meal_portions','[]')) loop
  if not exists(select 1 from public.planned_meals m join public.plan_recipe_ingredients i on i.cycle_id=m.cycle_id and i.recipe_id=m.recipe_id and i.user_id=m.user_id
    where m.id=(item->>'planned_meal_id')::uuid and m.user_id=u and i.food_id=item->>'food_id') then
   raise exception using errcode='23503',message='PORTION_INGREDIENT_MISSING';
  end if;
  insert into public.planned_meal_portions(user_id,planned_meal_id,food_id,quantity)
   values(u,(item->>'planned_meal_id')::uuid,item->>'food_id',(item->>'quantity')::numeric);
 end loop;
 for item in select value from jsonb_array_elements(coalesce(p_action->'day_targets','[]')) loop
  insert into public.plan_day_targets(user_id,cycle_id,meal_date,calculation_version,input_signature,event_signature,target)
   values(u,(item->>'cycle_id')::uuid,(item->>'meal_date')::date,item->>'calculation_version',item->>'input_signature',coalesce(item->>'event_signature',''),item->'target')
   on conflict(cycle_id,meal_date,user_id) do update set calculation_version=excluded.calculation_version,input_signature=excluded.input_signature,event_signature=excluded.event_signature,target=excluded.target;
 end loop;
 -- Any newly supplied active/scheduled cycle must have a reproducible recipe,
 -- complete ingredient portions for every slot, and 21 saved daily targets.
 if exists(select 1 from public.plan_cycles c where c.user_id=u and c.status in ('active','scheduled')
   and (exists(select 1 from jsonb_array_elements(coalesce(p_action->'cycles','[]')||coalesce(p_action->'plan_recipes','[]')||coalesce(p_action->'plan_ingredients','[]')||coalesce(p_action->'day_targets','[]')) x where coalesce(x->>'cycle_id',x->>'id')=c.id::text)
     or exists(select 1 from jsonb_array_elements(coalesce(p_action->'meal_portions','[]')) x join public.planned_meals m on m.id=(x->>'planned_meal_id')::uuid where m.user_id=u and m.cycle_id=c.id))
   and (exists(select 1 from public.planned_meals m where m.user_id=u and m.cycle_id=c.id and
     (not exists(select 1 from public.plan_recipe_snapshots r where r.user_id=u and r.cycle_id=m.cycle_id and r.recipe_id=m.recipe_id)
      or exists(select 1 from public.plan_recipe_snapshots r where r.user_id=u and r.cycle_id=m.cycle_id and r.recipe_id=m.recipe_id and r.meal_type <> case m.slot when 0 then 'desayuno' when 1 then 'media' when 2 then 'comida' when 3 then 'tarde' else 'cena' end and not(m.slot in (1,3) and r.meal_type in ('media','tarde')))
      or not exists(select 1 from public.plan_recipe_ingredients i where i.user_id=u and i.cycle_id=m.cycle_id and i.recipe_id=m.recipe_id)
      or exists(select 1 from public.plan_recipe_ingredients i where i.user_id=u and i.cycle_id=m.cycle_id and i.recipe_id=m.recipe_id
        and not exists(select 1 from public.planned_meal_portions p where p.user_id=u and p.planned_meal_id=m.id and p.food_id=i.food_id))))
     or (select count(*) from public.plan_day_targets d where d.user_id=u and d.cycle_id=c.id and d.meal_date between c.start_date and c.start_date+20)<>21)) then
  raise exception using errcode='22023',message='INCOMPLETE_PLAN_DETAILS';
 end if;
 update public.user_settings set account_contract=2 where user_id=u;
 if exists(select 1 from jsonb_array_elements(coalesce(p_action->'meal_portions','[]')) x
   join public.meal_completions c on c.planned_meal_id=(x->>'planned_meal_id')::uuid and c.user_id=u and c.reversed_at is null
   join public.meal_completion_ingredients i on i.completion_id=c.id and i.user_id=c.user_id and i.food_id=x->>'food_id'
   where abs(i.quantity-(x->>'quantity')::numeric)>0.0001) then
  raise exception using errcode='22023',message='COMPLETED_QUANTITY_IMMUTABLE';
 end if;
 insert into public.menuki_account_operations(user_id,operation_id,request_hash,accepted_revision) values(u,p_operation_id,request_hash,revision);
 return public.get_menuki_state();
end;
$action$;
revoke all on function public.apply_menuki_action(jsonb,bigint,uuid) from public, anon;
grant execute on function public.apply_menuki_action(jsonb,bigint,uuid) to authenticated;
commit;
