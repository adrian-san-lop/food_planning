-- Menuki no longer records meal shortfalls. Remove historical rows and keep
-- older sync RPC definitions compatible while suppressing future inserts.
begin;

create or replace function public.discard_retired_meal_shortfall()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return null;
end;
$function$;

revoke all on function public.discard_retired_meal_shortfall() from public, anon, authenticated;

drop trigger if exists discard_retired_meal_shortfall
  on public.meal_completion_shortfalls;
create trigger discard_retired_meal_shortfall
before insert or update on public.meal_completion_shortfalls
for each row execute function public.discard_retired_meal_shortfall();

delete from public.meal_completion_shortfalls
where completion_id is not null;

comment on table public.meal_completion_shortfalls is
  'Retired on 2026-10-18. Historical rows were purged; inserts and updates are suppressed by a compatibility trigger for older sync RPC definitions.';

commit;
