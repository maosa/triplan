'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberMe = formData.get('rememberMe') === 'on'

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Bootstrap theme cookie from user's profile so the root layout
    // can render the correct theme without a DB query on every navigation
    if (data.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('theme')
            .eq('id', data.user.id)
            .single()

        if (profile?.theme) {
            const cookieStore = await cookies()
            cookieStore.set('theme', profile.theme, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
            })
        }
    }

    redirect('/')
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

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
        redirect('/')
    } else {
        // Email confirmation required case
        return { success: 'Please check your email to confirm your account.' }
    }
}

export async function resetPassword(formData: FormData) {
    const email = formData.get('email') as string

    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || 'https://triathlonplan.vercel.app'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Check your email for a password reset link.' }
}

export async function updatePassword(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
    }

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

    // Clear theme cookie so the next user starts fresh
    const cookieStore = await cookies()
    cookieStore.delete('theme')

    redirect('/login')
}
