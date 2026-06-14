import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
    REMEMBER_ME_COOKIE,
    isPersistentSession,
    adjustAuthCookieOptions,
} from './remember-me'

// `rememberMe` is passed explicitly by the login action (the user's checkbox
// choice). For every other call it's read from the remember_me cookie so the
// session keeps the right persistence as the token is refreshed.
export async function createClient(opts?: { rememberMe?: boolean }) {
    const cookieStore = await cookies()
    const persistent =
        opts?.rememberMe ??
        isPersistentSession(cookieStore.get(REMEMBER_ME_COOKIE)?.value)

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(
                                name,
                                value,
                                adjustAuthCookieOptions(name, options, persistent)
                            )
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

// Convenience wrapper for server actions: builds the client and resolves the
// authenticated user in one step, throwing if there is no session. Returns both
// so callers can run queries and scope them by `user.id`.
export async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    return { supabase, user }
}
