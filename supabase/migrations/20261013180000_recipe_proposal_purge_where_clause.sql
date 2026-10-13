begin;

-- Supabase rejects bulk DELETE statements without an explicit predicate.
-- The primary key is NOT NULL, so this retains the confirmed purge scope.
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

comment on function public.clear_recipe_proposals(integer) is
  'Clears the shared recipe proposal inbox after validating the admin role and expected count; child rows cascade.';

commit;
