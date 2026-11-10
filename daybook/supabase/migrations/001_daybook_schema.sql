-- Daybook: sales and purchases, one private book per account.
-- This is the combined schema applied to the "ledger-tracker" Supabase project.

-- ---------- profiles: one row per account ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "own profile - select" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "own profile - update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- A profile is created automatically for every new account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- entries: one row per sale or purchase ----------
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('sale', 'purchase')),
  item_name text not null,
  price numeric(14,2) not null default 0,
  quantity numeric(14,2) not null default 1,
  note text,
  entry_date timestamptz not null default now(),  -- stamped automatically, editable
  created_at timestamptz not null default now(),
  constraint entries_item_name_len check (char_length(item_name) between 1 and 200),
  constraint entries_price_nonneg check (price >= 0),
  constraint entries_quantity_pos check (quantity > 0),
  constraint entries_note_len check (note is null or char_length(note) <= 500)
);
create index if not exists entries_user_date_idx on public.entries (user_id, entry_date desc);
alter table public.entries enable row level security;

-- Every account can only ever read or change its own rows.
create policy "own entries - select" on public.entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own entries - insert" on public.entries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own entries - update" on public.entries for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own entries - delete" on public.entries for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- month totals, in the caller's own timezone ----------
create or replace function public.month_totals(tz text default 'UTC')
returns table (
  month date,
  sales numeric,
  purchases numeric,
  sale_count bigint,
  purchase_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    date_trunc('month', entry_date at time zone tz)::date as month,
    coalesce(sum(price * quantity) filter (where kind = 'sale'), 0) as sales,
    coalesce(sum(price * quantity) filter (where kind = 'purchase'), 0) as purchases,
    count(*) filter (where kind = 'sale') as sale_count,
    count(*) filter (where kind = 'purchase') as purchase_count
  from public.entries
  where user_id = (select auth.uid())
  group by 1
  order by 1 desc;
$$;
revoke execute on function public.month_totals(text) from public, anon;
grant execute on function public.month_totals(text) to authenticated;
