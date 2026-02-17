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

    // Papa parse meta.fields contains the detected headers
    const headers = meta.fields || []
    // Check if lengths match and every expected header is present strictly (case sensitive based on prompt, though prompt has mixed case in description, likely exact match needed)
    // Prompt: "Race Name, Race Location, Race Date, Race Details, Workout Date, Workout Type, Workout Duration, Workout Distance, Workout Intensity, Workout Details"
    // Let's allow for slight flexibility or just be strict? "naming, spelling or order differs" -> Strict order and spelling.

    const isValidHeaders = headers.length === expectedHeaders.length &&
        headers.every((h, i) => h.trim() === expectedHeaders[i])

    if (!isValidHeaders) {
        return { error: `CSV columns should be: "Race Name, Race Location, Race Date, Race Details, Workout Date, Workout Type, Workout Duration, Workout Distance, Workout Intensity, Workout Details."` }
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

        // Workout Duration: HH:MM, max 99:99
        const wDuration = row['Workout Duration']?.trim()
        if (wDuration) {
            if (!/^\d{2}:\d{2}$/.test(wDuration)) {
                return { error: "Workout Duration should be formatted as HH:MM." }
            }
            const [hours, minutes] = wDuration.split(':').map(Number)
            // "cannot be larger than 99:99" implies strict string check or value check? 
            // 99 hours 99 minutes is technically valid in the prompt's loose restriction, 
            // but normally MM < 60. However, prompt specific error: "cannot be larger than 99:99"
            // Regex \d{2}:\d{2} ensures max 99:99 physically.
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
            // Check range
            if (isNaN(wInt) || wInt < 0 || wInt > 10) {
                return { error: "Workout Intensity should be between 0 and 10, and only have up to 1 decimal place." }
            }
            // Check decimal places: allow "10", "10.0", "5.5", but not "5.55"
            if (!/^\d+(\.\d{1})?$/.test(wIntRaw)) {
                return { error: "Workout Intensity should be between 0 and 10, and only have up to 1 decimal place." }
            }
        }
    }


    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Parse logic (Re-use existing structure but now simplified since consistency is guaranteed)
    // We only have ONE race to import per CSV now based on the consistency check.

    // Parse Race Date (strictly DD/MM/YYYY as per prompts context? No, Race Date row check earlier didn't check format, just consistency.
    // NOTE: Prompt only explicitly asked for "Workout Date" format check. 
    // BUT, subsequent logic needs valid date for DB.
    // Let's assume Race Date also needs to be parsable. 
    // Using `parseDate` helper which supports DD/MM/YYYY.

    const raceDate = parseDate(raceDateRef)
    if (!raceDate) {
        // Fallback error if race date is garbage, though not explicitly requested.
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
        // We validated format earlier, so we can assume it parses correctly with our helper
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
    // Parts: [day, month, year]
    const parts = dateStr.split('/')
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        const year = parts[2]
        // Basic validation
        if (year.length === 4) {
            return `${year}-${month}-${day}`
        }
    }

    return null
}
