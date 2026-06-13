-- MIGRATION: 20260614_rename_maintenance_session
-- Renames the two daily session identifiers from AM/PM to first_session/second_session,
-- in both maintenance_entries.session (values) and profiles.maintenance_defaults (JSON keys).
-- The UI already shows "1st"/"2nd"; this aligns the stored data so it is no longer tied to
-- a (now-misleading) time of day. In-place UPDATEs only — no rows are deleted/recreated, so
-- ids/dates/types/timestamps are untouched and the change is a reversible bijection.
--
-- Applied to production 2026-06-14 via Supabase migration of the same name.

-- 1. Relax the CHECK so the new values are permitted during conversion.
alter table public.maintenance_entries drop constraint if exists maintenance_entries_session_check;

-- 2. Convert existing session values in place.
update public.maintenance_entries
set session = case session
    when 'AM' then 'first_session'
    when 'PM' then 'second_session'
    else session
end;

-- 3. Re-tighten the CHECK to the new allowed values only.
alter table public.maintenance_entries
    add constraint maintenance_entries_session_check
    check (session in ('first_session', 'second_session'));

-- 4. Rename the per-day keys in each saved default schedule (am -> first_session, pm -> second_session).
update public.profiles
set maintenance_defaults = (
    select jsonb_object_agg(
        day_key,
        jsonb_build_object(
            'first_session', day_val->'am',
            'second_session', day_val->'pm'
        )
    )
    from jsonb_each(maintenance_defaults) as d(day_key, day_val)
)
where maintenance_defaults is not null and maintenance_defaults <> '{}'::jsonb;
