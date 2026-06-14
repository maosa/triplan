-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  first_name text,
  last_name text,
  units text default 'metric',
  theme text default 'dark',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RACES TABLE
create table races (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  location text,
  date date not null,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WORKOUTS TABLE
create table workouts (
  id uuid default uuid_generate_v4() primary key,
  race_id uuid references races on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  type text not null check (type in ('Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other')),
  duration text, -- Storing as HH:MM text or interval. Text is simpler for basic UI validation, but interval is better for math. Let's use text for now to match UI "HH:MM".
  distance numeric,
  intensity numeric check (intensity >= 0 and intensity <= 10),
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table races enable row level security;
alter table workouts enable row level security;

-- POLICIES

-- Profiles: Users can view/edit their own profile
-- Profiles: Users can view/edit their own profile
create policy "Users can view own profile" on profiles
  for select using (id = (select auth.uid()));

create policy "Users can update own profile" on profiles
  for update using (id = (select auth.uid()));

-- Races: Users can view/insert/update/delete their own races
create policy "Users can view own races" on races
  for select using (user_id = (select auth.uid()));

create policy "Users can insert own races" on races
  for insert with check (user_id = (select auth.uid()));

create policy "Users can update own races" on races
  for update using (user_id = (select auth.uid()));

create policy "Users can delete own races" on races
  for delete using (user_id = (select auth.uid()));

-- Workouts: Users can view/insert/update/delete their own workouts
create policy "Users can view own workouts" on workouts
  for select using (user_id = (select auth.uid()));

create policy "Users can insert own workouts" on workouts
  for insert with check (user_id = (select auth.uid()));

create policy "Users can update own workouts" on workouts
  for update using (user_id = (select auth.uid()));

create policy "Users can delete own workouts" on workouts
  for delete using (user_id = (select auth.uid()));

-- TRIGGER for Profile Creation
-- Automatically create a profile entry when a new user signs up via Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, '', '');
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Trigger-only function: it fires via the trigger mechanism, so no client role
-- needs (or should have) EXECUTE on it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- FUNCTION to Delete User (Self)
create or replace function delete_user()
returns void as $$
begin
  -- Delete from public tables triggers via cascade if configured,
  -- but deleting auth.users cascades to everything referencing it usually.
  -- users can't delete from auth.users directly.
  -- This function must be Security Definer to access auth.users.
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = '';

-- Called by the app as the authenticated user (self-delete), scoped to auth.uid();
-- keep authenticated only.
revoke execute on function delete_user() from public, anon;

-- MIGRATION: 20260612_maintenance_and_results
-- New columns on profiles
alter table profiles
  add column landing_page text not null default 'races'
    check (landing_page in ('races', 'maintenance', 'results'));

alter table profiles
  add column maintenance_defaults jsonb not null default '{}'::jsonb;

-- MAINTENANCE_ENTRIES TABLE
create table maintenance_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  session text not null check (session in ('first_session', 'second_session')),
  type text not null check (type in ('Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date, session)
);

alter table maintenance_entries enable row level security;

create policy "Users can view own maintenance entries" on maintenance_entries
  for select using (user_id = (select auth.uid()));
create policy "Users can insert own maintenance entries" on maintenance_entries
  for insert with check (user_id = (select auth.uid()));
create policy "Users can update own maintenance entries" on maintenance_entries
  for update using (user_id = (select auth.uid()));
create policy "Users can delete own maintenance entries" on maintenance_entries
  for delete using (user_id = (select auth.uid()));

create index idx_maintenance_entries_user_date on maintenance_entries (user_id, date);

-- RACE_RESULTS TABLE
create table race_results (
  race_id uuid references races on delete cascade primary key,
  user_id uuid references auth.users on delete cascade not null,

  swim_distance numeric,
  swim_time_seconds integer,
  swim_pace_seconds integer,

  t1_time_seconds integer,

  bike_distance numeric,
  bike_elevation numeric,
  bike_time_seconds integer,
  bike_speed numeric,

  t2_time_seconds integer,

  run_distance numeric,
  run_time_seconds integer,
  run_pace_seconds integer,

  total_time_seconds integer,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table race_results enable row level security;

create policy "Users can view own race results" on race_results
  for select using (user_id = (select auth.uid()));
create policy "Users can insert own race results" on race_results
  for insert with check (user_id = (select auth.uid()));
create policy "Users can update own race results" on race_results
  for update using (user_id = (select auth.uid()));
create policy "Users can delete own race results" on race_results
  for delete using (user_id = (select auth.uid()));
