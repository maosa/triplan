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
  type text not null check (type in ('Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Stretching', 'Other')),
  duration text, -- Storing as HH:MM text or interval. Text is simpler for basic UI validation, but interval is better for math. Let's use text for now to match UI "HH:MM".
  distance numeric,
  intensity numeric check (intensity >= 0 and intensity <= 10),
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table races enable row level security;
alter table workouts enable row level security;

-- POLICIES

-- Profiles: Users can view/edit their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Races: Users can view/insert/update/delete their own races
create policy "Users can view own races" on races
  for select using (auth.uid() = user_id);

create policy "Users can insert own races" on races
  for insert with check (auth.uid() = user_id);

create policy "Users can update own races" on races
  for update using (auth.uid() = user_id);

create policy "Users can delete own races" on races
  for delete using (auth.uid() = user_id);

-- Workouts: Users can view/insert/update/delete their own workouts
create policy "Users can view own workouts" on workouts
  for select using (auth.uid() = user_id);

create policy "Users can insert own workouts" on workouts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts" on workouts
  for update using (auth.uid() = user_id);

create policy "Users can delete own workouts" on workouts
  for delete using (auth.uid() = user_id);

-- TRIGGER for Profile Creation
-- Automatically create a profile entry when a new user signs up via Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, '', '');
  return new;
end;
$$ language plpgsql security definer;

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
$$ language plpgsql security definer;
