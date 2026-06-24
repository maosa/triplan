-- Migration: add run elevation gain to race_results
--
-- Mirrors bike_elevation. Nullable, no default (results are fully manual and any
-- field may be left blank). Stored as a plain number; the unit (m / ft) follows
-- profiles.units in the UI, like the other distance/elevation fields.

ALTER TABLE race_results ADD COLUMN run_elevation numeric;
