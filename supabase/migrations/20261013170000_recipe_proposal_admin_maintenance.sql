begin;

-- Admin edits replace the proposal content transactionally. Direct table
-- writes remain revoked; the RPC rechecks the private admin allowlist.
create or replace function public.update_recipe_proposal(
  p_proposal_id uuid,
  p_expected jsonb,
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
  v_proposal_id uuid;
  v_current jsonb;
  v_requested jsonb;
  v_item record;
begin
  if not public.is_menuki_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_proposal_id is null then
    raise exception using errcode = '22023', message = 'INVALID_PROPOSAL_ID';
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

  v_requested := pg_catalog.jsonb_build_object(
    'mealType', p_meal_type,
    'name', btrim(p_recipe_name),
    'ingredients', (
      select pg_catalog.jsonb_agg(btrim(item.value) order by item.ordinality)
      from pg_catalog.jsonb_array_elements_text(p_ingredients) with ordinality as item(value, ordinality)
    ),
    'steps', (
      select pg_catalog.jsonb_agg(btrim(item.value) order by item.ordinality)
      from pg_catalog.jsonb_array_elements_text(p_steps) with ordinality as item(value, ordinality)
    )
  );

  select proposal.id
  into v_proposal_id
  from public.recipe_proposals as proposal
  where proposal.id = p_proposal_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'PROPOSAL_NOT_FOUND';
  end if;

  -- Read the children in a new statement snapshot after the parent lock has
  -- been acquired, so a concurrent admin edit cannot produce a mixed version.
  select
    pg_catalog.jsonb_build_object(
      'mealType', proposal.meal_type,
      'name', proposal.recipe_name,
      'ingredients', coalesce((
        select pg_catalog.jsonb_agg(ingredient.ingredient_text order by ingredient.position)
        from public.recipe_proposal_ingredients as ingredient
        where ingredient.proposal_id = proposal.id
      ), '[]'::pg_catalog.jsonb),
      'steps', coalesce((
        select pg_catalog.jsonb_agg(step.step_text order by step.position)
        from public.recipe_proposal_steps as step
        where step.proposal_id = proposal.id
      ), '[]'::pg_catalog.jsonb)
    )
  into v_current
  from public.recipe_proposals as proposal
  where proposal.id = v_proposal_id;
  if p_expected is null then
    raise exception using errcode = 'PT409', message = 'PROPOSAL_CHANGED';
  end if;
  if p_expected is distinct from v_current then
    if v_requested is not distinct from v_current then
      return v_proposal_id;
    end if;
    raise exception using errcode = 'PT409', message = 'PROPOSAL_CHANGED';
  end if;

  update public.recipe_proposals
  set meal_type = p_meal_type,
      recipe_name = btrim(p_recipe_name)
  where id = v_proposal_id;

  delete from public.recipe_proposal_ingredients where proposal_id = v_proposal_id;
  delete from public.recipe_proposal_steps where proposal_id = v_proposal_id;

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

revoke all on function public.update_recipe_proposal(uuid, jsonb, text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.update_recipe_proposal(uuid, jsonb, text, text, jsonb, jsonb) to authenticated;

create or replace function public.delete_recipe_proposal(
  p_proposal_id uuid,
  p_expected jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposal_id uuid;
  v_current jsonb;
begin
  if not public.is_menuki_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_proposal_id is null then
    raise exception using errcode = '22023', message = 'INVALID_PROPOSAL_ID';
  end if;

  select proposal.id
  into v_proposal_id
  from public.recipe_proposals as proposal
  where proposal.id = p_proposal_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'PROPOSAL_NOT_FOUND';
  end if;

  -- Use a fresh statement snapshot after acquiring the lock for a consistent
  -- comparison against the ordered child rows.
  select
    pg_catalog.jsonb_build_object(
      'mealType', proposal.meal_type,
      'name', proposal.recipe_name,
      'ingredients', coalesce((
        select pg_catalog.jsonb_agg(ingredient.ingredient_text order by ingredient.position)
        from public.recipe_proposal_ingredients as ingredient
        where ingredient.proposal_id = proposal.id
      ), '[]'::pg_catalog.jsonb),
      'steps', coalesce((
        select pg_catalog.jsonb_agg(step.step_text order by step.position)
        from public.recipe_proposal_steps as step
        where step.proposal_id = proposal.id
      ), '[]'::pg_catalog.jsonb)
    )
  into v_current
  from public.recipe_proposals as proposal
  where proposal.id = v_proposal_id;
  if p_expected is null or p_expected is distinct from v_current then
    raise exception using errcode = 'PT409', message = 'PROPOSAL_CHANGED';
  end if;

  delete from public.recipe_proposals where id = v_proposal_id;
  return true;
end;
$$;

revoke all on function public.delete_recipe_proposal(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.delete_recipe_proposal(uuid, jsonb) to authenticated;

comment on function public.update_recipe_proposal(uuid, jsonb, text, text, jsonb, jsonb) is
  'Updates one shared recipe proposal and its ordered text children atomically; only menuki admins may call it.';
comment on function public.delete_recipe_proposal(uuid, jsonb) is
  'Deletes one shared recipe proposal and cascades to its text children; only menuki admins may call it.';

commit;
