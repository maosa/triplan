-- Migration: make races.race_type NOT NULL
--
-- Follows 20260628_races_add_race_type.sql, which added the column as nullable so
-- existing rows could be backfilled manually. All rows now have a type, and the
-- app requires one on create/edit and CSV import, so enforce it at the DB level.
--
-- Precondition: no NULL race_type rows remain (backfill first if running on a
-- database where legacy rows are still untyped).

ALTER TABLE races ALTER COLUMN race_type SET NOT NULL;
