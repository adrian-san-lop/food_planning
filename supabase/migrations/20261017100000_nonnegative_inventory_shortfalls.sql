-- Keep physical inventory at or above zero and retain meal shortfalls separately.
begin;

create table if not exists public.meal_completion_shortfalls (
  completion_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id text not null,
  quantity numeric(14, 4) not null check (quantity > 0),
  unit text not null check (unit in ('g', 'ml', 'ud')),
  created_at timestamptz not null default now(),
  primary key (completion_id, food_id),
  foreign key (completion_id, user_id)
    references public.meal_completions (id, user_id) on delete cascade
);

comment on table public.meal_completion_shortfalls is
  'Meal ingredients that exceeded pantry stock. These quantities are audit records and never affect the physical inventory balance or shopping calculation.';

alter table public.meal_completion_shortfalls enable row level security;
drop policy if exists meal_completion_shortfalls_select_own on public.meal_completion_shortfalls;
create policy meal_completion_shortfalls_select_own
  on public.meal_completion_shortfalls for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.meal_completion_shortfalls from public, anon, authenticated;
grant select on public.meal_completion_shortfalls to authenticated;

-- Meal movements are accepted only through the locked, transactional sync RPC.
-- The trigger also protects the balance if a stale device submits a meal after
-- another device has already consumed the same stock.
revoke insert on public.inventory_movements from authenticated;
grant select on public.inventory_movements to authenticated;

-- A meal with no available stock still needs a durable idempotency marker.
-- Zero-quantity meal rows do not affect the ledger balance.
alter table public.inventory_movements
  drop constraint if exists inventory_movements_quantity_check,
  drop constraint if exists inventory_movements_check,
  drop constraint if exists inventory_movements_check1,
  drop constraint if exists inventory_movements_meal_shortfall_check;
alter table public.inventory_movements
  add constraint inventory_movements_quantity_check
    check (quantity <> 0 or movement_kind = 'meal'),
  add constraint inventory_movements_meal_quantity_check
    check (
      (movement_kind = 'meal' and quantity <= 0 and source_completion_id is not null)
      or (movement_kind <> 'meal' and quantity <> 0)
    ),
  add constraint inventory_movements_meal_shortfall_check
    check (
      (movement_kind = 'meal' and source_completion_id is not null)
      or (movement_kind <> 'meal' and shortfall_quantity = 0)
    );

create or replace function public.clamp_meal_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_available numeric(14,4);
  v_client_shortfall numeric(14,4);
  v_requested numeric(14,4);
  v_missing numeric(14,4);
begin
  if new.movement_kind <> 'meal' then
    return new;
  end if;

  if exists (
    select 1 from public.inventory_movements
    where user_id = new.user_id and operation_id = new.operation_id
  ) then
    return new;
  end if;

  select coalesce(sum(quantity), 0) into v_available
  from public.inventory_movements
  where user_id = new.user_id and food_id = new.food_id;
  v_available := greatest(0, v_available);

  select coalesce(quantity, 0) into v_client_shortfall
  from public.meal_completion_shortfalls
  where completion_id = new.source_completion_id and food_id = new.food_id;
  v_requested := abs(new.quantity) + coalesce(v_client_shortfall, 0);
  v_missing := greatest(0, v_requested - v_available);
  new.quantity := -least(v_requested, v_available);
  new.shortfall_quantity := 0;

  if v_missing > 0 then
    insert into public.meal_completion_shortfalls (
      completion_id, user_id, food_id, quantity, unit
    ) values (
      new.source_completion_id, new.user_id, new.food_id, v_missing, new.unit
    )
    on conflict (completion_id, food_id) do update
      set quantity = excluded.quantity, unit = excluded.unit;
  else
    delete from public.meal_completion_shortfalls
    where completion_id = new.source_completion_id and food_id = new.food_id;
  end if;

  return new;
end
$$;

revoke all on function public.clamp_meal_inventory_movement() from public, anon, authenticated;
drop trigger if exists inventory_movements_clamp_meal on public.inventory_movements;
create trigger inventory_movements_clamp_meal
before insert on public.inventory_movements
for each row execute function public.clamp_meal_inventory_movement();

-- Preserve the historical shortfalls already stored on meal movements.
insert into public.meal_completion_shortfalls (
  completion_id, user_id, food_id, quantity, unit
)
select source_completion_id, user_id, food_id,
       sum(shortfall_quantity)::numeric(14,4), min(unit)
from public.inventory_movements
where movement_kind = 'meal'
  and source_completion_id is not null
  and shortfall_quantity > 0
group by source_completion_id, user_id, food_id
on conflict (completion_id, food_id) do nothing;

-- Cancel legacy negative totals once, without deleting or rewriting ledger history.
with balances as (
  select user_id, food_id, min(unit) as unit, sum(quantity) as balance
  from public.inventory_movements
  group by user_id, food_id
  having sum(quantity) < -0.001
)
insert into public.inventory_movements (
  user_id, food_id, quantity, unit, movement_kind, operation_id, note
)
select user_id, food_id, round(-balance, 4), unit, 'adjustment',
       'v9-stock-floor:' || food_id,
       'Regularización del saldo mínimo al actualizar a v9'
from balances
on conflict (user_id, operation_id) do nothing;

-- Extend the deployed sync RPC while preserving its current conflict handling,
-- grants, and all other transaction logic.
do $migration$
declare
  v_signature regprocedure := 'public.sync_menuki_state(jsonb,bigint)'::regprocedure;
  v_definition text;
  v_updated_definition text;
  v_movement_loop_pattern constant text := $pattern$([[:space:]]*for[[:space:]]+v_item[[:space:]]+in[[:space:]]+select[[:space:]]+value[[:space:]]+from[^;]*movements[^;]*loop)$pattern$;
  v_insert constant text := E'  for v_item in select value from pg_catalog.jsonb_array_elements(p_snapshot -> ''completions'')\n  loop\n    select id into v_completion_id\n    from public.meal_completions\n    where user_id = v_user_id and operation_id = v_item ->> ''operation_id'';\n    if v_completion_id is null then\n      raise exception using errcode = ''23503'', message = ''Missing meal completion for inventory shortfall'';\n    end if;\n    for v_child in select value from pg_catalog.jsonb_array_elements(coalesce(v_item -> ''shortfalls'', ''[]''::jsonb))\n    loop\n      insert into public.meal_completion_shortfalls (completion_id, user_id, food_id, quantity, unit)\n      values (v_completion_id, v_user_id, v_child ->> ''food_id'',\n        (v_child ->> ''quantity'')::numeric(14,4), v_child ->> ''unit'')\n      on conflict (completion_id, food_id) do nothing;\n    end loop;\n  end loop;\n';
begin
  v_definition := pg_catalog.pg_get_functiondef(v_signature);
  if pg_catalog.strpos(v_definition, 'meal_completion_shortfalls') > 0 then
    null;
  else
    v_updated_definition := pg_catalog.regexp_replace(
      v_definition,
      v_movement_loop_pattern,
      v_insert || E'\\1',
      'i'
    );
    if v_updated_definition = v_definition then
      raise exception 'Could not find the movement insertion point in %', v_signature;
    end if;
    v_updated_definition := pg_catalog.regexp_replace(v_updated_definition, ';[[:space:]]*$', '');
    execute v_updated_definition;
  end if;
end
$migration$;

commit;
