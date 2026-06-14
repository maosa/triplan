import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
    REMEMBER_ME_COOKIE,
    isPersistentSession,
    adjustAuthCookieOptions,
} from './remember-me'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Honor the user's "Remember me" choice as Supabase rotates the session
    // token on refresh — without this the refreshed auth cookies would revert
    // to the library's default (persistent) lifetime.
    const persistent = isPersistentSession(
        request.cookies.get(REMEMBER_ME_COOKIE)?.value
    )

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(
                            name,
                            value,
                            adjustAuthCookieOptions(name, options, persistent)
                        )
                    )
                },
            },
        }
    )

    // refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isPublicRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password')

    if (!user && !isPublicRoute) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}
