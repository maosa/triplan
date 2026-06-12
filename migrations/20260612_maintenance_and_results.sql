-- Step 1: maintenance_entries, race_results tables + profiles columns

-- 1.1 New columns on profiles
alter table profiles
  add column landing_page text not null default 'races'
    check (landing_page in ('races', 'maintenance', 'results'));

alter table profiles
  add column maintenance_defaults jsonb not null default '{}'::jsonb;

-- 1.2 maintenance_entries table
create table maintenance_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  session text not null check (session in ('AM', 'PM')),
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

-- 1.3 race_results table
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
