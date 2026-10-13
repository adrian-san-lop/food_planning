begin;

-- Admin membership is assigned by the project owner in SQL Editor. No client
-- role can grant itself access to this table.
create table public.menuki_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.menuki_admins enable row level security;
revoke all on table public.menuki_admins from anon, authenticated, public;

create table public.recipe_proposals (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  meal_type text not null check (meal_type in ('desayuno', 'comida', 'snack', 'cena')),
  recipe_name text not null check (length(btrim(recipe_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint recipe_proposals_submitter_client_unique unique (submitter_id, client_id)
);

create table public.recipe_proposal_ingredients (
  proposal_id uuid not null references public.recipe_proposals(id) on delete cascade,
  position smallint not null check (position between 1 and 30),
  ingredient_text text not null check (length(btrim(ingredient_text)) between 1 and 160),
  primary key (proposal_id, position)
);

create table public.recipe_proposal_steps (
  proposal_id uuid not null references public.recipe_proposals(id) on delete cascade,
  position smallint not null check (position between 1 and 30),
  step_text text not null check (length(btrim(step_text)) between 1 and 500),
  primary key (proposal_id, position)
);

create index recipe_proposals_created_at_idx
  on public.recipe_proposals (created_at desc);

alter table public.recipe_proposals enable row level security;
alter table public.recipe_proposal_ingredients enable row level security;
alter table public.recipe_proposal_steps enable row level security;

revoke all on table
  public.recipe_proposals,
  public.recipe_proposal_ingredients,
  public.recipe_proposal_steps
from anon, authenticated, public;

grant select on table
  public.recipe_proposals,
  public.recipe_proposal_ingredients,
  public.recipe_proposal_steps
to authenticated;

create or replace function public.is_menuki_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.menuki_admins as admin_row
    where admin_row.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_menuki_admin() from public, anon, authenticated;
grant execute on function public.is_menuki_admin() to authenticated;

create policy recipe_proposals_admin_select
  on public.recipe_proposals
  for select to authenticated
  using (public.is_menuki_admin());

create policy recipe_proposal_ingredients_admin_select
  on public.recipe_proposal_ingredients
  for select to authenticated
  using (public.is_menuki_admin());

create policy recipe_proposal_steps_admin_select
  on public.recipe_proposal_steps
  for select to authenticated
  using (public.is_menuki_admin());

create or replace function public.submit_recipe_proposal(
  p_client_id uuid,
  p_meal_type text,
  p_recipe_name text,
  p_ingredients jsonb,
  p_steps jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submitter_id uuid := (select auth.uid());
  v_proposal_id uuid;
  v_item record;
begin
  if v_submitter_id is null then
    raise exception using errcode = '28000', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if p_client_id is null then
    raise exception using errcode = '22023', message = 'INVALID_CLIENT_ID';
  end if;
  if p_meal_type is null or p_meal_type not in ('desayuno', 'comida', 'snack', 'cena') then
    raise exception using errcode = '22023', message = 'INVALID_MEAL_TYPE';
  end if;
  if length(btrim(coalesce(p_recipe_name, ''))) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'INVALID_RECIPE_NAME';
  end if;

  if pg_catalog.jsonb_typeof(p_ingredients) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'INVALID_INGREDIENTS';
  end if;
  if pg_catalog.jsonb_array_length(p_ingredients) not between 1 and 30 then
    raise exception using errcode = '22023', message = 'INVALID_INGREDIENT_COUNT';
  end if;
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_ingredients) as item(value)
    where pg_catalog.jsonb_typeof(item.value) is distinct from 'string'
       or length(btrim(item.value #>> '{}')) not between 1 and 160
  ) then
    raise exception using errcode = '22023', message = 'INVALID_INGREDIENT';
  end if;

  if pg_catalog.jsonb_typeof(p_steps) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'INVALID_STEPS';
  end if;
  if pg_catalog.jsonb_array_length(p_steps) not between 1 and 30 then
    raise exception using errcode = '22023', message = 'INVALID_STEP_COUNT';
  end if;
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_steps) as item(value)
    where pg_catalog.jsonb_typeof(item.value) is distinct from 'string'
       or length(btrim(item.value #>> '{}')) not between 1 and 500
  ) then
    raise exception using errcode = '22023', message = 'INVALID_STEP';
  end if;

  insert into public.recipe_proposals (submitter_id, client_id, meal_type, recipe_name)
  values (v_submitter_id, p_client_id, p_meal_type, btrim(p_recipe_name))
  on conflict (submitter_id, client_id) do nothing
  returning id into v_proposal_id;

  if v_proposal_id is null then
    select proposal.id into v_proposal_id
    from public.recipe_proposals as proposal
    where proposal.submitter_id = v_submitter_id
      and proposal.client_id = p_client_id;
    return v_proposal_id;
  end if;

  for v_item in
    select item.value, item.ordinality
    from pg_catalog.jsonb_array_elements_text(p_ingredients) with ordinality as item(value, ordinality)
  loop
    insert into public.recipe_proposal_ingredients (proposal_id, position, ingredient_text)
    values (v_proposal_id, v_item.ordinality::smallint, btrim(v_item.value));
  end loop;

  for v_item in
    select item.value, item.ordinality
    from pg_catalog.jsonb_array_elements_text(p_steps) with ordinality as item(value, ordinality)
  loop
    insert into public.recipe_proposal_steps (proposal_id, position, step_text)
    values (v_proposal_id, v_item.ordinality::smallint, btrim(v_item.value));
  end loop;

  return v_proposal_id;
end;
$$;

revoke all on function public.submit_recipe_proposal(uuid, text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.submit_recipe_proposal(uuid, text, text, jsonb, jsonb) to authenticated;

create or replace function public.clear_recipe_proposals(p_expected_count integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_menuki_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_expected_count is null or p_expected_count < 0 then
    raise exception using errcode = '22023', message = 'INVALID_EXPECTED_COUNT';
  end if;

  -- Block concurrent submissions between the count check and the purge.
  lock table public.recipe_proposals in exclusive mode;
  select count(*)::integer into v_count from public.recipe_proposals;
  if v_count <> p_expected_count then
    raise exception using errcode = 'PT409', message = 'PROPOSAL_COUNT_CHANGED';
  end if;

  delete from public.recipe_proposals where id is not null;
  return v_count;
end;
$$;

revoke all on function public.clear_recipe_proposals(integer) from public, anon, authenticated;
grant execute on function public.clear_recipe_proposals(integer) to authenticated;

comment on table public.recipe_proposals is
  'Shared inbox of raw user recipe ideas; nutrition and catalog details are added manually with AI assistance before publication to JSON catalogs.';
comment on table public.recipe_proposal_ingredients is
  'Ordered free-text ingredients submitted with a recipe proposal; no amounts or nutrition are inferred or stored here.';
comment on table public.recipe_proposal_steps is
  'Ordered preparation steps submitted with a recipe proposal.';
comment on table public.menuki_admins is
  'Admin account allowlist. Membership is managed by the project owner and cannot be changed by browser clients.';

commit;
