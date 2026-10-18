-- Extend personal movement levels and preserve the closest existing multiplier.
-- Apply to the configured Supabase project before deploying a client that writes
-- the new activity_level values.

begin;

alter table public.profiles
  drop constraint if exists profiles_activity_level_check;

update public.profiles
set activity_level = case activity_level
  when 'very_low' then 'sedentary'
  when 'low' then 'light'
  when 'medium' then 'light'
  when 'high' then 'moderate'
  else activity_level
end;

alter table public.profiles
  alter column activity_level set default 'sedentary',
  add constraint profiles_activity_level_check
    check (activity_level in (
      'very_sedentary',
      'sedentary',
      'light',
      'moderate',
      'intense',
      'very_intense'
    ));

commit;
