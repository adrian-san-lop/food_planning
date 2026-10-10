-- Remove Supabase default table grants, then allow only the operations required by the app.
-- This is a corrective migration for the initial schema migration.

begin;

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
from anon, authenticated, public;

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

commit;
