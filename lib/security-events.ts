import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import * as Sentry from '@sentry/nextjs'

export type SecurityEventType =
    | 'account_deleted'
    | 'email_changed'
    | 'password_changed'
    | 'failed_login'
    | 'password_reset_requested'
    | 'csv_import'
    | 'csv_export'

interface LogEventOptions {
    userId: string | null       // null for pre-authentication events (e.g. failed_login)
    eventType: SecurityEventType
    metadata?: Record<string, unknown>
    ipAddress?: string | null
    userAgent?: string | null
}

/**
 * One-way SHA-256 hash of an email address.
 * Store this instead of the raw address so we can correlate events
 * without double-storing PII in the audit log.
 */
export function hashEmail(email: string): string {
    return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

/**
 * Inserts a row into the security_events table.
 *
 * Failures are caught and logged to stderr so a logging error never
 * breaks the primary user action that triggered it.
 */
export async function logSecurityEvent(opts: LogEventOptions): Promise<void> {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('security_events').insert({
            user_id: opts.userId,
            event_type: opts.eventType,
            metadata: opts.metadata ?? {},
            ip_address: opts.ipAddress ?? null,
            user_agent: opts.userAgent ?? null,
        })
        if (error) {
            console.error('[security_events] insert failed:', error)
            Sentry.captureException(error, { tags: { context: 'security_events.insert' } })
        }
    } catch (err) {
        console.error('[security_events] unexpected error:', err)
        Sentry.captureException(err, { tags: { context: 'security_events' } })
    }
}

/**
 * Logs a failed login attempt via the SECURITY DEFINER Postgres function.
 *
 * This is necessary because at the point of a failed login there is no
 * authenticated Supabase session, so the standard RLS INSERT policy
 * (user_id = auth.uid()) would reject the insert.
 * The log_failed_login() function runs as the Postgres superuser and
 * can insert the row safely.
 */
export async function logFailedLogin(
    email: string,
    ipAddress?: string | null,
    userAgent?: string | null,
): Promise<void> {
    try {
        const supabase = await createClient()
        const { error } = await supabase.rpc('log_failed_login', {
            p_email: email,
            p_ip: ipAddress ?? null,
            p_ua: userAgent ?? null,
        })
        if (error) {
            console.error('[security_events] log_failed_login rpc failed:', error)
        }
    } catch (err) {
        console.error('[security_events] unexpected error in logFailedLogin:', err)
    }
}
