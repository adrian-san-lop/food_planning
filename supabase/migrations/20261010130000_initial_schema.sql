-- Mi Plan Saludable: initial private data schema.
-- This migration is intentionally additive. It does not drop or rewrite data.
-- Apply only to the intended Supabase project after reviewing the schema.

begin;

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sex text not null default 'manual'
    check (sex in ('male', 'female', 'manual')),
  age smallint not null check (age between 18 and 95),
  height_cm numeric(5, 1) not null check (height_cm between 125 and 220),
  reference_weight_kg numeric(5, 1) not null check (reference_weight_kg between 35 and 250),
  activity_level text not null default 'low'
    check (activity_level in ('very_low', 'low', 'medium', 'high')),
  training_bonus_kcal smallint not null default 0
    check (training_bonus_kcal between 0 and 400),
  goal text not null default 'maintain'
    check (goal in ('maintain', 'recomp', 'fat_loss', 'muscle_gain')),
  injury_recovery boolean not null default false,
  auto_portions boolean not null default true,
  follow_weight boolean not null default false,
  manual_rmr_kcal smallint not null default 1600
    check (manual_rmr_kcal between 800 and 3500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  status text not null check (status in ('draft', 'scheduled', 'active', 'archived', 'superseded')),
  catalog_version text not null,
  generated_at timestamptz,
  confirmed_at timestamptz,
  supersedes_cycle_id uuid,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (supersedes_cycle_id, user_id)
    references public.plan_cycles (id, user_id)
    on delete restrict
);

create unique index plan_cycles_one_draft_per_user
  on public.plan_cycles (user_id) where status = 'draft';
create unique index plan_cycles_one_scheduled_per_user
  on public.plan_cycles (user_id) where status = 'scheduled';
create unique index plan_cycles_one_active_per_user
  on public.plan_cycles (user_id) where status = 'active';
create index plan_cycles_user_start_date_idx
  on public.plan_cycles (user_id, start_date desc);

create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_id uuid not null,
  meal_date date not null,
  slot smallint not null check (slot between 0 and 4),
  recipe_id text not null,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (cycle_id, meal_date, slot),
  foreign key (cycle_id, user_id)
    references public.plan_cycles (id, user_id)
    on delete cascade
);
create index planned_meals_user_date_idx
  on public.planned_meals (user_id, meal_date);

create table public.meal_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  planned_meal_id uuid not null,
  recipe_id_snapshot text not null,
  catalog_version text not null,
  operation_id text not null,
  completed_at timestamptz not null default now(),
  reversed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, operation_id),
  foreign key (planned_meal_id, user_id)
    references public.planned_meals (id, user_id)
    on delete restrict
);
create unique index meal_completions_one_unreversed_per_meal
  on public.meal_completions (user_id, planned_meal_id)
  where reversed_at is null;
create index meal_completions_user_completed_at_idx
  on public.meal_completions (user_id, completed_at desc);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id text not null,
  quantity numeric(14, 4) not null check (quantity <> 0),
  unit text not null check (unit in ('g', 'ml', 'ud')),
  movement_kind text not null
    check (movement_kind in ('opening', 'purchase', 'meal', 'adjustment', 'waste', 'reversal')),
  operation_id text not null,
  operation_group_id text,
  source_completion_id uuid,
  reverses_movement_id uuid,
  shortfall_quantity numeric(14, 4) not null default 0
    check (shortfall_quantity >= 0 and shortfall_quantity <= abs(quantity)),
  note text,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, operation_id),
  foreign key (source_completion_id, user_id)
    references public.meal_completions (id, user_id)
    on delete restrict,
  foreign key (reverses_movement_id, user_id)
    references public.inventory_movements (id, user_id)
    on delete restrict,
  check (
    (movement_kind = 'meal' and quantity < 0 and source_completion_id is not null)
    or (movement_kind <> 'meal' and shortfall_quantity = 0)
  ),
  check ((movement_kind = 'reversal') = (reverses_movement_id is not null)),
  check (movement_kind <> 'purchase' or quantity > 0),
  check (movement_kind <> 'opening' or quantity > 0),
  check (movement_kind <> 'waste' or quantity < 0)
);
create unique index inventory_movements_one_reversal_per_event
  on public.inventory_movements (user_id, reverses_movement_id)
  where reverses_movement_id is not null;
create index inventory_movements_user_food_created_idx
  on public.inventory_movements (user_id, food_id, created_at desc);
create index inventory_movements_user_completion_idx
  on public.inventory_movements (user_id, source_completion_id)
  where source_completion_id is not null;

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 2) not null check (weight_kg between 30 and 250),
  created_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

create table public.training_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  training_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, training_date)
);

create table public.prep_tasks (
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_id uuid not null,
  week_index smallint not null check (week_index between 0 and 2),
  task_key text not null,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (cycle_id, week_index, task_key),
  foreign key (cycle_id, user_id)
    references public.plan_cycles (id, user_id)
    on delete cascade
);

create table public.shopping_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  window_key text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (id, user_id)
);
create unique index shopping_sessions_one_open_per_user
  on public.shopping_sessions (user_id) where status = 'open';

create table public.shopping_session_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null,
  item_key text not null,
  food_id text not null,
  item_kind text not null check (item_kind in ('planned', 'extra')),
  is_checked boolean not null default false,
  package_count numeric(12, 3) not null default 0 check (package_count >= 0),
  package_size numeric(14, 4) not null check (package_size > 0),
  unit text not null check (unit in ('g', 'ml', 'ud')),
  updated_at timestamptz not null default now(),
  unique (session_id, item_key),
  foreign key (session_id, user_id)
    references public.shopping_sessions (id, user_id)
    on delete cascade
);

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_backup_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Every personal table has a direct user_id column so its policy is simple and auditable.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'plan_cycles',
    'planned_meals',
    'meal_completions',
    'inventory_movements',
    'weight_logs',
    'training_logs',
    'prep_tasks',
    'shopping_sessions',
    'shopping_session_items',
    'user_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name || '_insert_own', table_name
    );
  end loop;
end
$$;

create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy plan_cycles_update_own on public.plan_cycles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy planned_meals_update_own on public.planned_meals
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy meal_completions_update_own on public.meal_completions
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy weight_logs_update_own on public.weight_logs
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy training_logs_delete_own on public.training_logs
  for delete to authenticated using ((select auth.uid()) = user_id);
create policy prep_tasks_update_own on public.prep_tasks
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy shopping_sessions_update_own on public.shopping_sessions
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy shopping_sessions_delete_own on public.shopping_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);
create policy shopping_session_items_update_own on public.shopping_session_items
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy shopping_session_items_delete_own on public.shopping_session_items
  for delete to authenticated using ((select auth.uid()) = user_id);
create policy user_settings_update_own on public.user_settings
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Explicit least-privilege grants. Unauthenticated visitors get no access.
revoke all on table
  public.profiles,
  public.plan_cycles,
  public.planned_meals,
  public.meal_completions,
  public.inventory_movements,
  public.weight_logs,
  public.training_logs,
  public.prep_tasks,
  public.shopping_sessions,
  public.shopping_session_items,
  public.user_settings
from anon, public;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.plan_cycles to authenticated;
grant select, insert, update on public.planned_meals to authenticated;
grant select, insert on public.meal_completions to authenticated;
grant update (reversed_at) on public.meal_completions to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant select, insert, update on public.weight_logs to authenticated;
grant select, insert, delete on public.training_logs to authenticated;
grant select, insert, update on public.prep_tasks to authenticated;
grant select, insert, update, delete on public.shopping_sessions to authenticated;
grant select, insert, update, delete on public.shopping_session_items to authenticated;
grant select, insert, update on public.user_settings to authenticated;

comment on table public.inventory_movements is
  'Append-only stock ledger. Current stock is the sum of signed movements; never store a second authoritative balance.';
comment on table public.meal_completions is
  'Meal completion events. Reversals are retained as timestamps and compensating inventory movements, not deletes.';
comment on table public.shopping_session_items is
  'User selections and package choices for the generated shopping list; the required quantities remain derived from plan and inventory.';

commit;
