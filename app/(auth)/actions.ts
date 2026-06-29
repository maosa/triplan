'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { logFailedLogin, logSecurityEvent, hashEmail } from '@/lib/security-events'
import { REMEMBER_ME_COOKIE } from '@/lib/supabase/remember-me'
import { validatePassword } from '@/lib/validation'

type ActionResult = { error?: string; success?: boolean | string }

export async function login(formData: FormData): Promise<ActionResult> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberMe = formData.get('rememberMe') === 'on'

    // IP/UA are best-effort — proxies may strip them.
    const h = await headers()
    const ip = h.get('x-forwarded-for') ?? h.get('x-real-ip')

    // Pass the choice so the auth cookies are written with the right lifetime:
    // persistent when "Remember me" is checked, session-only otherwise.
    const supabase = await createClient({ rememberMe })

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        await logFailedLogin(email, ip, h.get('user-agent'))
        // Return a generic message to avoid leaking whether an email exists
        return { error: 'Invalid email or password.' }
    }

    if (data.user) {
        const cookieStore = await cookies()

        // Record the "Remember me" choice so middleware keeps the right cookie
        // lifetime on session refresh. Mirror the session's persistence: a
        // persistent flag for "remember me", a session cookie otherwise.
        cookieStore.set(REMEMBER_ME_COOKIE, rememberMe ? 'true' : 'false', {
            path: '/',
            ...(rememberMe ? { maxAge: 60 * 60 * 24 * 365 } : {}),
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        })

        // Bootstrap theme cookie from user's profile so the root layout
        // can render the correct theme without a DB query on every navigation
        const { data: profile } = await supabase
            .from('profiles')
            .select('theme')
            .eq('id', data.user.id)
            .single()

        if (profile?.theme) {
            cookieStore.set('theme', profile.theme, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
            })
        }
    }

    redirect('/')
}

export async function signup(formData: FormData): Promise<{ error?: string; success?: string }> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    const passwordError = validatePassword(password)
    if (passwordError) return { error: passwordError }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Create profile entry for the new user is handled by Database Trigger (supabase_schema.sql)
    // But we can also do it here if trigger fails, but trigger is safer.
    // Trigger ensures atomic creation.

    // If email confirmation is enabled, user needs to check email.
    // If disabled, they are logged in.
    // We should probably redirect to a "Check your email" page or home if auto-confirm.
    // Assuming auto-confirm for dev, but handling check email flow is better UX.

    if (data.session) {
        // New accounts default to a session-only cookie (no "Remember me" at
        // signup); the session ends when the browser closes until they opt in
        // at login. Recorded explicitly so middleware keeps the right lifetime.
        const cookieStore = await cookies()
        cookieStore.set(REMEMBER_ME_COOKIE, 'false', {
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        })
        redirect('/')
    } else {
        // Email confirmation required case
        return { success: 'Please check your email to confirm your account.' }
    }
}

export async function resetPassword(formData: FormData): Promise<{ error?: string; success?: string }> {
    const email = formData.get('email') as string

    const headersList = await headers()

    const supabase = await createClient()
    const origin = headersList.get('origin') || 'https://triathlonplan.vercel.app'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    await logSecurityEvent({
        userId: null, // no session at this point
        eventType: 'password_reset_requested',
        metadata: { email_hash: hashEmail(email) },
    })

    return { success: 'Check your email for a password reset link.' }
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    const passwordError = validatePassword(password)
    if (passwordError) return { error: passwordError }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    redirect('/login')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Clear the remember-me cookie so the next session starts fresh. Keep the
    // theme cookie: we send users to the landing page after logout, and the
    // landing reads this cookie — so their preferred theme carries over for a
    // more seamless exit (and re-login re-bootstraps it from their profile).
    const cookieStore = await cookies()
    cookieStore.delete(REMEMBER_ME_COOKIE)

    redirect('/')
}
