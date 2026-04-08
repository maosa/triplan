-- Add varchar length constraints to all unbounded text columns.
-- These mirror the limits already enforced at the application layer (app/actions.ts LIMITS)
-- and act as a database-level backstop against any bypass.
--
-- IMPORTANT: run 20260408_text_constraints_preflight.sql first and confirm all counts are 0.

-- PROFILES
ALTER TABLE profiles
    ALTER COLUMN email      TYPE varchar(254),   -- RFC 5321 hard maximum for email addresses
    ALTER COLUMN first_name TYPE varchar(100),   -- accommodates long names from any culture
    ALTER COLUMN last_name  TYPE varchar(100),
    ALTER COLUMN units      TYPE varchar(10),    -- 'metric' / 'imperial' + headroom
    ALTER COLUMN theme      TYPE varchar(10);    -- 'light' / 'dark' + headroom

-- RACES
ALTER TABLE races
    ALTER COLUMN name     TYPE varchar(255),     -- matches LIMITS.NAME in app/actions.ts
    ALTER COLUMN location TYPE varchar(255),     -- matches LIMITS.LOCATION
    ALTER COLUMN details  TYPE varchar(5000);    -- matches LIMITS.DETAILS

-- WORKOUTS
ALTER TABLE workouts
    ALTER COLUMN type     TYPE varchar(20),      -- longest value is 'Strength' (8 chars)
    ALTER COLUMN duration TYPE varchar(5),       -- exactly 'HH:MM'
    ALTER COLUMN details  TYPE varchar(5000);    -- matches LIMITS.DETAILS
