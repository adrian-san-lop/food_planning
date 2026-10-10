-- Store completed activity sessions as dated personal events.
-- This migration is additive and does not delete or rewrite existing data.

begin;

create table public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  activity_code text not null
    check (length(btrim(activity_code)) between 1 and 80),
  duration_minutes smallint not null
    check (duration_minutes between 1 and 600),
  met_value numeric(4, 2) not null
    check (met_value between 1 and 20),
  created_at timestamptz not null default now()
);

create index activity_sessions_user_date_idx
  on public.activity_sessions (user_id, session_date desc, created_at desc);

alter table public.activity_sessions enable row level security;

create policy activity_sessions_select_own on public.activity_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy activity_sessions_insert_own on public.activity_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy activity_sessions_delete_own on public.activity_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.activity_sessions from anon, authenticated, public;
grant select, insert, delete on public.activity_sessions to authenticated;

comment on table public.activity_sessions is
  'Completed, dated activity sessions. Multiple sessions per user and date are allowed; MET and duration are snapshots used for an estimated net-energy adjustment.';

comment on table public.training_logs is
  'Legacy one-day training flag. Retained for existing installations; new activity records use activity_sessions.';

comment on column public.profiles.training_bonus_kcal is
  'Legacy fixed training bonus. New activity calculations use dated activity_sessions and ignore this value.';

commit;
