-- Migration: constrain security_events.event_type to the known set
--
-- Mirrors the SecurityEventType union in lib/security-events.ts so a typo or a
-- new event type added in code without a migration fails loudly at insert time
-- instead of silently writing an unrecognised value into the audit log.
--
-- Safe/additive: existing rows already use these values. If a stray value were
-- present this would fail — run a SELECT DISTINCT event_type check first if in
-- doubt.

ALTER TABLE security_events
    ADD CONSTRAINT security_events_event_type_check
    CHECK (event_type IN (
        'account_deleted',
        'email_changed',
        'password_changed',
        'failed_login',
        'password_reset_requested',
        'csv_import',
        'csv_export'
    ));
