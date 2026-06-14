import type { CookieOptions } from '@supabase/ssr'

// Name of the cookie that records the user's "Remember me" choice at login.
// It is read on every request (page load + middleware refresh) so the auth
// cookies keep the right persistence as Supabase rotates the session token.
export const REMEMBER_ME_COOKIE = 'remember_me'

// Persistent only when the cookie is explicitly 'true'. Absent cookie ⇒
// session-only, so closing the browser ends the session unless the user opted
// into "Remember me". (Existing sessions with no cookie become session-only on
// their next browser close — the privacy-safe default.)
export function isPersistentSession(value: string | undefined): boolean {
    return value === 'true'
}

// When the session is NOT persistent ("Remember me" unchecked), strip the
// lifetime hints so Supabase's auth cookies become session cookies — the
// browser drops them when it closes. Persistent sessions keep the library's
// own (long) maxAge untouched. Non-auth cookies are left alone.
export function adjustAuthCookieOptions(
    name: string,
    options: CookieOptions | undefined,
    persistent: boolean,
): CookieOptions {
    const opts = options ?? {}
    if (persistent || !name.startsWith('sb-')) return opts
    // maxAge: 0 is the library deleting a cookie — leave removals intact,
    // otherwise we'd resurrect it as a session cookie.
    if (opts.maxAge === 0) return opts
    return { ...opts, maxAge: undefined, expires: undefined }
}
