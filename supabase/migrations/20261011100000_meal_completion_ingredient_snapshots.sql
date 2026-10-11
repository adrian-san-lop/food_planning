-- Preserve the recipe-unit quantities actually used for each completed meal.
-- Additive only; pantry movements remain recorded in their inventory units.

begin;

create table public.meal_completion_ingredients (
  completion_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  ingredient_index smallint not null check (ingredient_index >= 0),
  food_id text not null,
  ingredient_name_snapshot text not null
    check (length(btrim(ingredient_name_snapshot)) between 1 and 160),
  quantity numeric(14, 4) not null check (quantity > 0),
  recipe_unit text not null check (recipe_unit in ('g', 'ml', 'ud')),
  created_at timestamptz not null default now(),
  primary key (completion_id, ingredient_index),
  foreign key (completion_id, user_id)
    references public.meal_completions (id, user_id)
    on delete cascade
);

create index meal_completion_ingredients_user_completion_idx
  on public.meal_completion_ingredients (user_id, completion_id);

alter table public.meal_completion_ingredients enable row level security;

create policy meal_completion_ingredients_select_own
  on public.meal_completion_ingredients
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy meal_completion_ingredients_insert_own
  on public.meal_completion_ingredients
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on table public.meal_completion_ingredients from anon, authenticated, public;
grant select, insert on public.meal_completion_ingredients to authenticated;

comment on table public.meal_completion_ingredients is
  'Immutable ingredient-line snapshots for completed meals. Quantities use recipe_unit; inventory_movements retain inventory units.';
comment on column public.meal_completion_ingredients.ingredient_index is
  'Zero-based position in the recipe ingredient list used at completion time.';
comment on column public.meal_completion_ingredients.ingredient_name_snapshot is
  'Display name captured at completion time so catalog renames do not rewrite history.';

commit;
