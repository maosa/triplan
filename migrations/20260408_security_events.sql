-- Migration: create security_events audit log table
--
-- This table is append-only. RLS allows authenticated users to INSERT and SELECT
-- their own rows, but no UPDATE or DELETE policies are defined — so the log is
-- immutable from the application layer. The log_failed_login() SECURITY DEFINER
-- function handles pre-authentication inserts (failed logins) where no session
-- exists yet.

-- TABLE

CREATE TABLE security_events (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- NULL for pre-authentication events (e.g. failed_login before a session exists)
    user_id     uuid REFERENCES auth.users ON DELETE SET NULL,
    -- Machine-readable event identifier (see SecurityEventType in lib/security-events.ts)
    event_type  varchar(50) NOT NULL,
    -- Structured detail; never store raw PII — use hashEmail() for email addresses
    metadata    jsonb NOT NULL DEFAULT '{}',
    -- Best-effort network context (may be NULL if stripped by a proxy)
    ip_address  text,
    user_agent  text,
    created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events
CREATE POLICY "Users can insert own security events" ON security_events
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Authenticated users can read their own events (for a future security activity UI)
CREATE POLICY "Users can view own security events" ON security_events
    FOR SELECT USING (user_id = (SELECT auth.uid()));

-- No UPDATE or DELETE policies — the table is append-only.

-- INDEXES

-- Efficient per-user queries (most common access pattern)
CREATE INDEX security_events_user_id_created_at_idx
    ON security_events (user_id, created_at DESC);

-- Efficient event-type queries (e.g. all failed_login events across users)
CREATE INDEX security_events_event_type_idx
    ON security_events (event_type);

-- SECURITY DEFINER FUNCTION for pre-authentication events
--
-- Called by logFailedLogin() in lib/security-events.ts when a login attempt fails.
-- At that point there is no authenticated session, so the standard RLS INSERT
-- policy (user_id = auth.uid()) would reject a direct insert. This function runs
-- as the Postgres superuser and bypasses RLS safely.
--
-- Privacy note: the email itself is not stored — only a one-way SHA-256 hex hash
-- so events can be correlated without exposing the address.

CREATE OR REPLACE FUNCTION log_failed_login(
    p_email text,
    p_ip    text DEFAULT NULL,
    p_ua    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO security_events (user_id, event_type, metadata, ip_address, user_agent)
    VALUES (
        -- Attempt to resolve the email to a user_id.
        -- Returns NULL if the email is not registered (intentionally does not
        -- reveal whether the address exists in the system).
        (SELECT id FROM auth.users WHERE email = p_email LIMIT 1),
        'failed_login',
        jsonb_build_object('email_hash', encode(sha256(p_email::bytea), 'hex')),
        p_ip,
        p_ua
    );
END;
$$;

-- Grant execute to anon and authenticated so server actions can call it
-- without needing the service_role key.
GRANT EXECUTE ON FUNCTION log_failed_login(text, text, text) TO anon, authenticated;
