-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 30),
  bodyweight_kg numeric(5, 1) check (bodyweight_kg > 0 and bodyweight_kg < 400),
  trial_started_at timestamptz not null default now(),
  is_pro boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Users may only change their name and bodyweight. Trial date and Pro status are server-controlled.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, bodyweight_kg) on public.profiles to authenticated;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new account gets a profile; the trial starts at sign-up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ============ ACCESS HELPERS ============
create function public.has_logging_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.is_pro or now() < p.trial_started_at + interval '60 days'
       from public.profiles p where p.id = (select auth.uid())),
    false);
$$;
revoke execute on function public.has_logging_access() from public, anon;
grant execute on function public.has_logging_access() to authenticated;

-- Lets the app move the trial start EARLIER (e.g. the user used the app offline before
-- signing up). It can never move it later, so this cannot extend a trial.
create function public.claim_earlier_trial_start(started_at timestamptz) returns timestamptz
language sql security definer set search_path = '' as $$
  update public.profiles
     set trial_started_at = least(trial_started_at, greatest(started_at, timestamptz '2026-01-01'))
   where id = (select auth.uid()) and started_at <= now()
  returning trial_started_at;
$$;
revoke execute on function public.claim_earlier_trial_start(timestamptz) from public, anon;
grant execute on function public.claim_earlier_trial_start(timestamptz) to authenticated;

-- Account deletion from inside the app (required by the App Store once accounts exist).
create function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ============ WORKOUTS ============
create table public.workouts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 40),
  date timestamptz not null,
  entries jsonb not null check (jsonb_typeof(entries) = 'array' and pg_column_size(entries) < 65536),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index workouts_user_date_idx on public.workouts (user_id, date desc);
alter table public.workouts enable row level security;

create policy "workouts: read own" on public.workouts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "workouts: add own while trial or Pro" on public.workouts
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_logging_access()));
create policy "workouts: delete own" on public.workouts
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.workouts from anon, authenticated;
grant select, insert, delete on public.workouts to authenticated;

-- ============ SKILL STEPS (ticked by hand) ============
create table public.skill_steps (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  step_id text not null check (char_length(step_id) between 1 and 40),
  done_at timestamptz not null default now(),
  primary key (user_id, step_id)
);
alter table public.skill_steps enable row level security;

create policy "skill_steps: read own" on public.skill_steps
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "skill_steps: add own while trial or Pro" on public.skill_steps
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_logging_access()));
create policy "skill_steps: delete own" on public.skill_steps
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.skill_steps from anon, authenticated;
grant select, insert, delete on public.skill_steps to authenticated;

-- ============ LEADERBOARD ============
create table public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  board text not null check (board in ('max_pull_ups', 'max_muscle_ups', 'weighted_pull_up_kg', 'handstand_hold_sec')),
  value numeric(6, 1) not null check (value > 0 and value < 1000),
  video_path text check (char_length(video_path) <= 300),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index leaderboard_entries_user_idx on public.leaderboard_entries (user_id);
create index leaderboard_entries_verified_idx on public.leaderboard_entries (board, value desc) where status = 'verified';
alter table public.leaderboard_entries enable row level security;

create policy "leaderboard: read own entries" on public.leaderboard_entries
  for select to authenticated using ((select auth.uid()) = user_id);
-- New entries always start as pending; only the server/moderators can verify.
create policy "leaderboard: submit own pending entry" on public.leaderboard_entries
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and reviewed_at is null
    and (select public.has_logging_access())
  );
create policy "leaderboard: withdraw own pending entry" on public.leaderboard_entries
  for delete to authenticated using ((select auth.uid()) = user_id and status = 'pending');

revoke all on public.leaderboard_entries from anon, authenticated;
grant select, insert, delete on public.leaderboard_entries to authenticated;

-- Public ranking: each person's best verified score, showing only display name and value.
create function public.get_leaderboard(board_name text, max_rows integer default 50)
returns table (rank bigint, display_name text, value numeric, achieved_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with best as (
    select distinct on (e.user_id) e.user_id, e.value, e.created_at
      from public.leaderboard_entries e
     where e.board = board_name and e.status = 'verified'
     order by e.user_id, e.value desc, e.created_at asc
  )
  select rank() over (order by b.value desc),
         coalesce(nullif(trim(p.display_name), ''), 'Athlete'),
         b.value,
         b.created_at
    from best b
    join public.profiles p on p.id = b.user_id
   order by b.value desc, b.created_at asc
   limit least(greatest(max_rows, 1), 100);
$$;
revoke execute on function public.get_leaderboard(text, integer) from public;
grant execute on function public.get_leaderboard(text, integer) to anon, authenticated;

-- Trigger helper must not be callable through the API.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
