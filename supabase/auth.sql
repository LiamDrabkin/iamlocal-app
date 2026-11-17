-- Accounts and per-user state. Run after schema.sql (setup.sql does both, plus the sample data).
-- Security model: every table below is private. Row-level security lets a signed-in user
-- read and write only their own row; anonymous visitors can touch none of it.

-- One profile row per account, created automatically when someone signs up.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

-- Interim home for a user's follows, likes, posts and settings (one JSON document per user).
-- To be replaced by normalised tables once the data model is settled.
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "own state read" on public.user_state;
create policy "own state read" on public.user_state for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "own state insert" on public.user_state;
create policy "own state insert" on public.user_state for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "own state update" on public.user_state;
create policy "own state update" on public.user_state for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "own state delete" on public.user_state;
create policy "own state delete" on public.user_state for delete to authenticated using (user_id = (select auth.uid()));

-- Create the profile row on sign-up. SECURITY DEFINER with an empty search_path, as Supabase recommends.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
