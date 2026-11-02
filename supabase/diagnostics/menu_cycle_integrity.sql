-- Read-only diagnosis for an account whose menu cycle cannot be restored.
-- Replace the email below with the account being checked, then run in Supabase SQL Editor.
with requested_user as (
  select id
  from auth.users
  where lower(email) = lower('REEMPLAZA_CON_EL_CORREO_DE_LA_CUENTA')
)
select
  c.id as cycle_id,
  c.status,
  c.start_date,
  c.catalog_version,
  count(m.id) as planned_rows,
  count(distinct (m.meal_date, m.slot)) filter (
    where m.meal_date between c.start_date and c.start_date + 20
      and m.slot between 0 and 4
  ) as valid_unique_slots,
  coalesce(bool_or(m.recipe_id = 'hamburguesa_pavo'), false) as has_retired_hamburguesa_pavo,
  array_agg(distinct m.recipe_id order by m.recipe_id) filter (where m.recipe_id is not null) as recipe_ids
from public.plan_cycles c
join requested_user u on u.id = c.user_id
left join public.planned_meals m on m.cycle_id = c.id
group by c.id, c.status, c.start_date, c.catalog_version
order by c.start_date desc, c.status;
