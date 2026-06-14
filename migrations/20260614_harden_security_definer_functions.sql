-- MIGRATION: 20260614_harden_security_definer_functions
-- Addresses Supabase security advisories on SECURITY DEFINER functions:
--   * function_search_path_mutable (handle_new_user, delete_user)
--   * {anon,authenticated}_security_definer_function_executable
-- Pins search_path on the two unpinned functions and removes EXECUTE grants that
-- no caller needs. Function bodies fully schema-qualify their references, so an
-- empty search_path is safe. Trigger / event-trigger functions run via the trigger
-- mechanism regardless of EXECUTE grants, so revoking client roles is safe.
--
-- Two grants are intentionally retained (and their advisories will persist by design):
--   * delete_user        -> authenticated  (app calls it as the signed-in user to self-delete)
--   * log_failed_login   -> anon           (logs failed logins pre-auth, when there is no session)
--
-- Applied to production 2026-06-14 via Supabase migration of the same name.

-- handle_new_user: signup trigger only — no RPC caller.
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- delete_user: keep authenticated (self-delete), drop anon/public.
alter function public.delete_user() set search_path = '';
revoke execute on function public.delete_user() from public, anon;

-- log_failed_login: keep anon (pre-auth logging), drop authenticated/public.
-- (search_path is already pinned to 'public' in 20260408_security_events.sql.)
revoke execute on function public.log_failed_login(text, text, text) from public, authenticated;

-- rls_auto_enable: DDL event-trigger function only — no RPC caller.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
