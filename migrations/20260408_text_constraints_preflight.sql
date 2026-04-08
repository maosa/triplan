-- Pre-flight checks for 20260408_text_constraints_alter.sql
--
-- Run this first. All counts must return 0 before applying the ALTER TABLE migration.
-- Any non-zero count means existing data would violate the new constraint and the
-- ALTER will fail — investigate and clean up those rows first.
--
-- Returns all 11 checks in a single result set so every count is visible at once.

SELECT 'profiles.email > 254'       AS check_name, count(*) AS violations FROM profiles WHERE length(email)      > 254
UNION ALL
SELECT 'profiles.first_name > 100',                                         count(*) FROM profiles WHERE length(first_name) > 100
UNION ALL
SELECT 'profiles.last_name > 100',                                          count(*) FROM profiles WHERE length(last_name)  > 100
UNION ALL
SELECT 'profiles.units > 10',                                               count(*) FROM profiles WHERE length(units)      > 10
UNION ALL
SELECT 'profiles.theme > 10',                                               count(*) FROM profiles WHERE length(theme)      > 10
UNION ALL
SELECT 'races.name > 255',                                                  count(*) FROM races    WHERE length(name)       > 255
UNION ALL
SELECT 'races.location > 255',                                              count(*) FROM races    WHERE length(location)   > 255
UNION ALL
SELECT 'races.details > 5000',                                              count(*) FROM races    WHERE length(details)    > 5000
UNION ALL
SELECT 'workouts.type > 20',                                                count(*) FROM workouts WHERE length(type)       > 20
UNION ALL
SELECT 'workouts.duration > 5',                                             count(*) FROM workouts WHERE length(duration)   > 5
UNION ALL
SELECT 'workouts.details > 5000',                                           count(*) FROM workouts WHERE length(details)    > 5000;
