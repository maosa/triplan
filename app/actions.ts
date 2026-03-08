'use server'


import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import Papa from 'papaparse'

type Race = Database['public']['Tables']['races']['Row']

export async function createRace(formData: FormData) {
    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const date = formData.get('date') as string
    const details = formData.get('details') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    // Validate date?
    // Supabase will enforce basic types.

    const { error } = await supabase.from('races').insert({
        user_id: user.id,
        name,
        location,
        date, // YYYY-MM-DD
        details,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function deleteRace(raceId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('races').delete().eq('id', raceId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function updateRace(raceId: string, formData: FormData) {
    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const date = formData.get('date') as string
    const details = formData.get('details') as string

    const supabase = await createClient()

    const { error } = await supabase.from('races').update({
        name,
        location,
        date,
        details,
    }).eq('id', raceId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}
// Workout Actions

export async function createWorkout(raceId: string, formData: FormData) {
    const date = formData.get('date') as string
    const type = formData.get('type') as string
    const duration = formData.get('duration') as string
    const distance = formData.get('distance') ? Number(formData.get('distance')) : null
    const intensity = formData.get('intensity') ? Number(formData.get('intensity')) : null
    const details = formData.get('details') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const dateCheck = await validateWorkoutDate(supabase, raceId, date)
    if (dateCheck.error) return { error: dateCheck.error }

    // Force intensity to 0 if Rest
    const finalIntensity = type === 'Rest' ? 0 : intensity

    const { error } = await supabase.from('workouts').insert({
        race_id: raceId,
        user_id: user.id,
        date,
        type: type as any, // Cast to enum
        duration: duration || null,
        distance,
        intensity: finalIntensity,
        details,
        // created_at and updated_at default to now()
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/${raceId}`)
    return { success: true }
}

export async function updateWorkout(workoutId: string, raceId: string, formData: FormData) {
    const date = formData.get('date') as string
    const type = formData.get('type') as string
    const duration = formData.get('duration') as string
    const distance = formData.get('distance') ? Number(formData.get('distance')) : null
    const intensity = formData.get('intensity') ? Number(formData.get('intensity')) : null
    const details = formData.get('details') as string

    const supabase = await createClient()

    const dateCheck = await validateWorkoutDate(supabase, raceId, date)
    if (dateCheck.error) return { error: dateCheck.error }

    const finalIntensity = type === 'Rest' ? 0 : intensity

    const { error } = await supabase.from('workouts').update({
        date,
        type: type as any,
        duration: duration || null,
        distance,
        intensity: finalIntensity,
        details,
        updated_at: new Date().toISOString()
    }).eq('id', workoutId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/${raceId}`)
    return { success: true }
}

export async function deleteWorkout(workoutId: string, raceId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('workouts').delete().eq('id', workoutId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/${raceId}`)
    return { success: true }
}

export async function duplicateWorkout(workout: Database['public']['Tables']['workouts']['Row']) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    // Clone with date = today
    const finalDate = new Date().toISOString().split('T')[0]

    const dateCheck = await validateWorkoutDate(supabase, workout.race_id, finalDate)
    if (dateCheck.error) {
        return { error: 'Cannot duplicate: Today is after the race date.' }
    }

    const { error } = await supabase.from('workouts').insert({
        race_id: workout.race_id,
        user_id: user.id,
        date: finalDate,
        type: workout.type,
        duration: workout.duration,
        distance: workout.distance,
        intensity: workout.intensity,
        details: workout.details,
        // created_at and updated_at default to now() which is correct for new duplicate
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/${workout.race_id}`)
    return { success: true }
}

// Profile Actions

export async function updateProfile(formData: FormData) {
    const units = formData.get('units') as string
    const theme = formData.get('theme') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase.from('profiles').update({
        units: units as 'metric' | 'imperial',
        theme: theme as 'light' | 'dark',
    }).eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    // Sync theme to cookie so the root layout can read it without a DB query
    const cookieStore = await cookies()
    cookieStore.set('theme', theme, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
    })

    // Do NOT revalidate path to prevent client component remount/snap-back.
    // Client side state is updated optimistically.
    // revalidatePath('/', 'layout')
    return { success: true }
}

export async function deleteAccount(formData: FormData) {
    const supabase = await createClient()

    const { error } = await supabase.rpc('delete_user')

    if (error) {
        return { error: error.message }
    }

    await supabase.auth.signOut()
    redirect('/login')
}

export async function updateSecuritySettings(currentEmail: string, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const updates: Record<string, string> = {}
    if (email && email !== currentEmail) updates.email = email
    if (password) updates.password = password

    if (Object.keys(updates).length === 0) {
        return { error: 'No changes to update.' }
    }

    const { error } = await supabase.auth.updateUser(updates)
    if (error) {
        return { error: error.message }
    }

    return { success: 'Security settings updated successfully.' }
}

export async function importCsvData(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    const text = await file.text()
    const { data, meta, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })

    if (errors.length > 0) return { error: 'CSV parsing error. Please check format.' }

    const rows = data as any[]
    if (rows.length === 0) return { error: 'CSV is empty.' }

    // 1. Validate Headers
    const expectedHeaders = [
        "Race Name", "Race Location", "Race Date", "Race Details",
        "Workout Date", "Workout Type", "Workout Duration",
        "Workout Distance", "Workout Intensity", "Workout Details"
    ]

    const headers = meta.fields || []

    const isValidHeaders = headers.length === expectedHeaders.length &&
        headers.every((h, i) => h.trim() === expectedHeaders[i])

    if (!isValidHeaders) {
        return { error: `CSV columns should be: "Race Name, Race Location, Race Date, Race Details, Workout Date, Workout Type, Workout Duration, Workout Distance, Workout Intensity, Workout Details."` }
    }

    // Detect Date Trend and Reverse if needed
    // We need to look at "Workout Date"
    // "If the workouts in the CSV are listed from latest to earliest [Descending]... reverse."

    let firstDate: Date | null = null
    let lastDate: Date | null = null

    // Find first valid date
    for (let i = 0; i < rows.length; i++) {
        const dStr = rows[i]['Workout Date']?.trim()
        if (dStr) {
            const d = parseDate(dStr) // YYYY-MM-DD
            if (d) {
                firstDate = new Date(d)
                break
            }
        }
    }

    // Find last valid date
    for (let i = rows.length - 1; i >= 0; i--) {
        const dStr = rows[i]['Workout Date']?.trim()
        if (dStr) {
            const d = parseDate(dStr)
            if (d) {
                lastDate = new Date(d)
                break
            }
        }
    }

    // If we have a range, check trend
    if (firstDate && lastDate) {
        // If First > Last, it's Descending (Newest to Oldest)
        // Reverse processing (Bottom -> Top) so Newest gets inserted Last and floats to the top of the UI.
        if (firstDate > lastDate) {
            rows.reverse()
        }
    }

    // 2. Race Consistency Check
    const firstRow = rows[0]
    const raceNameRef = firstRow['Race Name']?.trim()
    const raceLocationRef = firstRow['Race Location']?.trim()
    const raceDateRef = firstRow['Race Date']?.trim()
    const raceDetailsRef = firstRow['Race Details']?.trim()

    // We can check all rows for consistency relative to the first row (or just uniqueness across set)
    for (const row of rows) {
        if (row['Race Name']?.trim() !== raceNameRef) return { error: "Race Name should be the same across all rows." }
        if (row['Race Location']?.trim() !== raceLocationRef) return { error: "Race Location should be the same across all rows." }
        if (row['Race Date']?.trim() !== raceDateRef) return { error: "Race Date should be the same across all rows" }
        if (row['Race Details']?.trim() !== raceDetailsRef) return { error: "Race Details should be the same across all rows." }
    }

    // 3. Data Validation per Row
    const validTypes = new Set(["Swim", "Bike", "Run", "Strength", "Rest", "Other"])

    for (const row of rows) {
        // Workout Date: DD/MM/YYYY
        const wDate = row['Workout Date']?.trim()
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(wDate)) {
            return { error: "Workout Date should be formatted as DD/MM/YYYY." }
        }

        // Workout Type
        const wType = row['Workout Type']?.trim()
        if (!validTypes.has(wType)) {
            return { error: "Workout Type should be one of the following: Swim, Bike, Run, Strength, Rest, Other." }
        }

        // Workout Duration: HH:MM
        const wDuration = row['Workout Duration']?.trim()
        if (wDuration && !/^\d{2}:\d{2}$/.test(wDuration)) {
            return { error: "Workout Duration should be formatted as HH:MM." }
        }

        // Workout Distance: max 999.9
        const wDistRaw = row['Workout Distance']?.trim()
        if (wDistRaw) {
            const wDist = parseFloat(wDistRaw)
            if (isNaN(wDist) || wDist > 999.9) {
                return { error: "Workout Distance cannot be larger than 999.9." }
            }
        }

        // Workout Intensity: 0-10, max 1 decimal
        const wIntRaw = row['Workout Intensity']?.trim()
        if (wIntRaw) {
            const wInt = parseFloat(wIntRaw)
            if (isNaN(wInt) || wInt < 0 || wInt > 10) {
                return { error: "Workout Intensity should be between 0 and 10, and only have up to 1 decimal place." }
            }
            if (!/^\d+(\.\d{1})?$/.test(wIntRaw)) {
                return { error: "Workout Intensity should be between 0 and 10, and only have up to 1 decimal place." }
            }
        }
    }

    // 4. Insert Race and Workouts
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const raceDate = parseDate(raceDateRef)
    if (!raceDate) {
        return { error: "Race Date is invalid." }
    }

    // Check if race exists
    const { data: existing } = await supabase
        .from('races')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', raceNameRef)
        .eq('date', raceDate)
        .maybeSingle()

    if (existing) {
        return { error: `Import blocked: Race "${raceNameRef}" on ${raceDate} already exists.` }
    }

    // Insert Race
    const { data: race, error: raceError } = await supabase.from('races').insert({
        user_id: user.id,
        name: raceNameRef,
        location: raceLocationRef,
        date: raceDate,
        details: raceDetailsRef,
    }).select().single()

    if (raceError || !race) {
        return { error: `Failed to insert race: ${raceError?.message}` }
    }

    // Prepare Workouts
    const workoutsToInsert = []
    for (const row of rows) {
        const wDateRaw = row['Workout Date']?.trim()
        const wDate = parseDate(wDateRaw)!

        const wType = row['Workout Type']?.trim()
        const wDuration = row['Workout Duration']?.trim() || null
        const wDist = row['Workout Distance'] ? parseFloat(row['Workout Distance']) : null
        const wInt = row['Workout Intensity'] ? parseFloat(row['Workout Intensity']) : null
        const wDetails = row['Workout Details']?.trim() || ''

        workoutsToInsert.push({
            race_id: race.id,
            user_id: user.id,
            date: wDate,
            type: wType,
            duration: wDuration,
            distance: wDist,
            intensity: wInt,
            details: wDetails
        })
    }

    if (workoutsToInsert.length > 0) {
        const { error: wError } = await supabase.from('workouts').insert(workoutsToInsert)
        if (wError) {
            return { error: `Failed to insert workouts: ${wError.message}` }
        }
    }

    revalidatePath('/')
    return { success: true }
}

function parseDate(dateStr: string): string | null {
    if (!dateStr) return null

    // Check if YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

    // Check if DD/MM/YYYY
    const parts = dateStr.split('/')
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        const year = parts[2]
        if (year.length === 4) {
            return `${year}-${month}-${day}`
        }
    }

    return null
}

async function validateWorkoutDate(supabase: any, raceId: string, workoutDate: string) {
    const { data: race, error: raceError } = await supabase
        .from('races')
        .select('date')
        .eq('id', raceId)
        .single()

    if (raceError || !race) {
        return { error: 'Race not found' }
    }

    if (new Date(workoutDate) > new Date(race.date)) {
        return { error: 'Workout date cannot be after race date' }
    }

    return { success: true }
}
