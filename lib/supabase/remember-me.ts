import type { CookieOptions } from '@supabase/ssr'

// Name of the cookie that records the user's "Remember me" choice at login.
// It is read on every request (page load + middleware refresh) so the auth
// cookies keep the right persistence as Supabase rotates the session token.
export const REMEMBER_ME_COOKIE = 'remember_me'

// Returns true unless the remember-me cookie is explicitly 'false'. Absent
// cookie ⇒ persistent, so users already logged in before this feature shipped
// (and signups, which don't set the cookie) keep their long-lived session.
export function isPersistentSession(value: string | undefined): boolean {
    return value !== 'false'
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
