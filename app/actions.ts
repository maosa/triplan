'use server'


import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

    // Fetch race to validate date
    const { data: race, error: raceError } = await supabase
        .from('races')
        .select('date')
        .eq('id', raceId)
        .single()

    if (raceError || !race) {
        return { error: 'Race not found' }
    }

    if (new Date(date) > new Date(race.date)) {
        return { error: 'Workout date cannot be after race date' }
    }

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

    // Fetch race to validate date
    const { data: race, error: raceError } = await supabase
        .from('races')
        .select('date')
        .eq('id', raceId)
        .single()

    if (raceError || !race) {
        return { error: 'Race not found' }
    }

    if (new Date(date) > new Date(race.date)) {
        return { error: 'Workout date cannot be after race date' }
    }

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
    const today = new Date().toISOString().split('T')[0]

    // Need to check if today > race date?
    // Fetch race
    const { data: race } = await supabase.from('races').select('date').eq('id', workout.race_id).single()

    let finalDate = today
    if (race && new Date(today) > new Date(race.date)) {
        // If today is after race, maybe just use the original date or fail?
        // Prompt says: "Clone workout, Date set to today, Saved immediately"
        // But also "cannot exceed race date".
        // If today > race date, duplication might fail validation if we strictly enforce it.
        // But let's try to set to today. If it fails, user can edit. 
        // Actually, createWorkout logic checks date.
        // Let's assume strict check.
        if (new Date(today) > new Date(race.date)) {
            return { error: 'Cannot duplicate: Today is after the race date.' }
        }
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

    revalidatePath('/', 'layout')
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

export async function importCsvData(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    const text = await file.text()
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })

    if (errors.length > 0) return { error: 'CSV parsing error. Please check format.' }

    const rows = data as any[]
    if (rows.length === 0) return { error: 'CSV is empty.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Group by race
    const racesMap = new Map<string, {
        name: string,
        location: string,
        date: string,
        details: string,
        workouts: any[]
    }>()

    for (const row of rows) {
        const raceName = row['Race Name']?.trim()
        const raceDate = row['Race Date']?.trim()

        if (!raceName || !raceDate) continue; // Skip invalid rows

        const key = `${raceName}|${raceDate}`

        if (!racesMap.has(key)) {
            racesMap.set(key, {
                name: raceName,
                location: row['Race Location']?.trim() || '',
                date: raceDate,
                details: row['Race Details']?.trim() || '',
                workouts: []
            })
        }

        const workoutDate = row['Workout Date']?.trim()
        const workoutType = row['Workout Type']?.trim()

        if (workoutDate && workoutType) {
            racesMap.get(key)!.workouts.push({
                date: workoutDate,
                type: workoutType,
                duration: row['Workout Duration']?.trim() || null,
                distance: row['Workout Distance'] ? Number(row['Workout Distance']) : null,
                intensity: row['Workout Intensity'] ? Number(row['Workout Intensity']) : null,
                details: row['Workout Details']?.trim() || ''
            })
        }
    }

    // Validate existing races
    const raceKeys = Array.from(racesMap.keys())
    if (raceKeys.length === 0) return { error: 'No valid races found in CSV.' }

    // Check all potential races
    for (const key of raceKeys) {
        const [name, date] = key.split('|')
        const { data: existing } = await supabase
            .from('races')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', name)
            .eq('date', date)
            .maybeSingle()

        if (existing) {
            return { error: `Import blocked: Race "${name}" on ${date} already exists.` }
        }
    }

    // Insert Races and Workouts
    // We do them one by one preferably to map IDs
    for (const raceData of racesMap.values()) {
        const { data: race, error: raceError } = await supabase.from('races').insert({
            user_id: user.id,
            name: raceData.name,
            location: raceData.location,
            date: raceData.date,
            details: raceData.details,
        }).select().single()

        if (raceError || !race) {
            return { error: `Failed to insert race ${raceData.name}: ${raceError?.message}` }
        }

        if (raceData.workouts.length > 0) {
            const workoutsToInsert = raceData.workouts.map(w => ({
                race_id: race.id,
                user_id: user.id,
                date: w.date,
                type: w.type,
                duration: w.duration,
                distance: w.distance,
                intensity: w.intensity,
                details: w.details
            }))

            const { error: wError } = await supabase.from('workouts').insert(workoutsToInsert)
            if (wError) {
                // Potentially leave partial state (race without workouts)?
                // Transaction would be better but simple inserts logic for now.
                // If failure, we might want to cleanup?
                // For MVP, return error.
                return { error: `Failed to insert workouts for ${raceData.name}: ${wError.message}` }
            }
        }
    }

    revalidatePath('/')
    return { success: true }
}
