-- Migration: add race_type to races
--
-- Broadens the app beyond triathlon to single-discipline races (swim / bike / run).
-- Nullable with no default: existing rows stay NULL and are treated as triathlon for
-- display; new races require a type at the application layer. CHECK keeps the four
-- supported values in sync with lib/race-constants.ts.

ALTER TABLE races ADD COLUMN race_type text
  CHECK (race_type IN ('swim', 'bike', 'run', 'triathlon'));
