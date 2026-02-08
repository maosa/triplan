'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberMe = formData.get('rememberMe') === 'on'

    const supabase = await createClient()

    // Supabase Auth handles logic.
    // By default, Supabase generic auth with cookie storage is persistent.
    // Standard session is long-lived refresh token.
    // If "Remember Me" is UNCHECKED, we might want to use a session-scoped cookie,
    // but Supabase SSR helper sets cookies with reasonable defaults.
    // For simplicity and standard behavior, we'll stick to default persistence.
    // If we really need transient sessions, we'd have to tweak the cookie options.

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
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
        return { success: 'Please checks your email to confirm your account.' }
    }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
