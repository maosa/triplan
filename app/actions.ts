'use server'


import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Database, WorkoutType, MaintenanceSession } from '@/types/database'
import { WORKOUT_TYPES, WORKOUT_TYPE_SET, MAINTENANCE_SESSIONS, DAY_KEYS } from '@/lib/workout-constants'
import Papa from 'papaparse'
import { logSecurityEvent, hashEmail } from '@/lib/security-events'
import { parseTimeToSeconds, parsePaceToSeconds, isValidTimeString, isValidPaceString } from '@/lib/time-format'
import { toDateString } from '@/lib/date-utils'
import { validatePassword } from '@/lib/validation'

// Consistent return type for all server actions so callers can safely do `result?.error`
// without TypeScript complaining about discriminated union property access.
type ActionResult = { error?: string; success?: boolean | string }

// Field length limits — enforced here in addition to DB constraints
const LIMITS = {
    NAME: 255,
    LOCATION: 255,
    DETAILS: 5000,
    DURATION: 5,   // HH:MM
    DISTANCE: 999.9,
}

// Validates a basic email format server-side
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Returns a safe, generic message for unexpected DB errors.
// Always log the real error server-side for debugging.
function dbError(context: string, error: unknown): { error: string } {
    console.error(`[DB Error] ${context}:`, error)
    return { error: 'Something went wrong. Please try again.' }
}

export async function createRace(formData: FormData): Promise<ActionResult> {
    const name = (formData.get('name') as string)?.trim()
    const location = (formData.get('location') as string)?.trim()
    const date = (formData.get('date') as string)?.trim()
    const details = (formData.get('details') as string)?.trim()

    if (!name || name.length > LIMITS.NAME) return { error: 'Race name is required and must be under 255 characters.' }
    if (location && location.length > LIMITS.LOCATION) return { error: 'Location must be under 255 characters.' }
    if (details && details.length > LIMITS.DETAILS) return { error: 'Details must be under 5000 characters.' }
    if (!date) return { error: 'Race date is required.' }

    const { supabase, user } = await getAuthenticatedUser()

    const { error } = await supabase.from('races').insert({
        user_id: user.id,
        name,
        location,
        date, // YYYY-MM-DD
        details,
    })

    if (error) return dbError('createRace', error)

    revalidatePath('/')
    return { success: true }
}

export async function deleteRace(raceId: string): Promise<ActionResult> {
    const { supabase, user } = await getAuthenticatedUser()

    // Scope by user_id as defense-in-depth alongside RLS — a single extra
    // indexed predicate, no extra round-trip.
    const { error } = await supabase.from('races').delete().eq('id', raceId).eq('user_id', user.id)

    if (error) return dbError('deleteRace', error)

    revalidatePath('/')
    return { success: true }
}

export async function updateRace(raceId: string, formData: FormData): Promise<ActionResult> {
    const name = (formData.get('name') as string)?.trim()
    const location = (formData.get('location') as string)?.trim()
    const date = (formData.get('date') as string)?.trim()
    const details = (formData.get('details') as string)?.trim()

    if (!name || name.length > LIMITS.NAME) return { error: 'Race name is required and must be under 255 characters.' }
    if (location && location.length > LIMITS.LOCATION) return { error: 'Location must be under 255 characters.' }
    if (details && details.length > LIMITS.DETAILS) return { error: 'Details must be under 5000 characters.' }
    if (!date) return { error: 'Race date is required.' }

    const { supabase, user } = await getAuthenticatedUser()

    const { error } = await supabase.from('races').update({
        name,
        location,
        date,
        details,
    }).eq('id', raceId).eq('user_id', user.id)

    if (error) return dbError('updateRace', error)

    revalidatePath('/')
    return { success: true }
}

// Workout Actions

export async function createWorkout(raceId: string, formData: FormData): Promise<ActionResult> {
    const date = formData.get('date') as string
    const type = formData.get('type') as string
    const duration = formData.get('duration') as string
    const distance = formData.get('distance') ? Number(formData.get('distance')) : null
    const intensity = formData.get('intensity') ? Number(formData.get('intensity')) : null
    const details = ((formData.get('details') as string) || '').trim()

    if (details.length > LIMITS.DETAILS) return { error: 'Details must be under 5000 characters.' }
    if (intensity !== null && (intensity < 0 || intensity > 10)) return { error: 'Intensity must be between 0 and 10.' }

    const { supabase, user } = await getAuthenticatedUser()

    const dateCheck = await validateWorkoutDate(supabase, raceId, date)
    if (dateCheck.error) return { error: dateCheck.error }

    // Force intensity to 0 if Rest
    const finalIntensity = type === 'Rest' ? 0 : intensity

    const { error } = await supabase.from('workouts').insert({
        race_id: raceId,
        user_id: user.id,
        date,
        type: type as WorkoutType,
        duration: duration || null,
        distance,
        intensity: finalIntensity,
        details,
        // created_at and updated_at default to now()
    })

    if (error) return dbError('createWorkout', error)

    revalidatePath(`/${raceId}`)
    return { success: true }
}

export async function updateWorkout(workoutId: string, raceId: string, formData: FormData): Promise<ActionResult> {
    const date = formData.get('date') as string
    const type = formData.get('type') as string
    const duration = formData.get('duration') as string
    const distance = formData.get('distance') ? Number(formData.get('distance')) : null
    const intensity = formData.get('intensity') ? Number(formData.get('intensity')) : null
    const details = ((formData.get('details') as string) || '').trim()

    if (details.length > LIMITS.DETAILS) return { error: 'Details must be under 5000 characters.' }
    if (intensity !== null && (intensity < 0 || intensity > 10)) return { error: 'Intensity must be between 0 and 10.' }

    const { supabase, user } = await getAuthenticatedUser()

    const dateCheck = await validateWorkoutDate(supabase, raceId, date)
    if (dateCheck.error) return { error: dateCheck.error }

    const finalIntensity = type === 'Rest' ? 0 : intensity

    const { error } = await supabase.from('workouts').update({
        date,
        type: type as WorkoutType,
        duration: duration || null,
        distance,
        intensity: finalIntensity,
        details,
        updated_at: new Date().toISOString()
    }).eq('id', workoutId).eq('user_id', user.id)

    if (error) return dbError('updateWorkout', error)

    revalidatePath(`/${raceId}`)
    return { success: true }
}

export async function deleteWorkout(workoutId: string, raceId: string): Promise<ActionResult> {
    const { supabase, user } = await getAuthenticatedUser()

    const { error } = await supabase.from('workouts').delete().eq('id', workoutId).eq('user_id', user.id)

    if (error) return dbError('deleteWorkout', error)

    revalidatePath(`/${raceId}`)
    return { success: true }
}

export async function duplicateWorkout(workout: Database['public']['Tables']['workouts']['Row']): Promise<ActionResult> {
    const { supabase, user } = await getAuthenticatedUser()

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

    if (error) return dbError('duplicateWorkout', error)

    revalidatePath(`/${workout.race_id}`)
    return { success: true }
}

// Race Results Actions

export async function upsertRaceResult(raceId: string, formData: FormData): Promise<ActionResult> {
    if (!raceId) return { error: 'Missing race.' }

    const { supabase, user } = await getAuthenticatedUser()

    // Parse a numeric field: blank -> null, otherwise a finite non-negative number.
    const parseNumber = (key: string): { value: number | null; error?: string } => {
        const raw = ((formData.get(key) as string) || '').trim()
        if (!raw) return { value: null }
        const n = Number(raw)
        if (!Number.isFinite(n) || n < 0) return { value: null, error: `Invalid value for ${key}.` }
        return { value: n }
    }

    // Parse a time field (H:MM:SS / M:SS) -> seconds. Blank -> null.
    const parseTime = (key: string): { value: number | null; error?: string } => {
        const raw = ((formData.get(key) as string) || '').trim()
        if (!raw) return { value: null }
        if (!isValidTimeString(raw)) return { value: null, error: `Invalid time format for ${key} (use HH:MM:SS).` }
        return { value: parseTimeToSeconds(raw) }
    }

    // Parse a pace field (MM:SS) -> seconds. Blank -> null.
    const parsePace = (key: string): { value: number | null; error?: string } => {
        const raw = ((formData.get(key) as string) || '').trim()
        if (!raw) return { value: null }
        if (!isValidPaceString(raw)) return { value: null, error: `Invalid pace format for ${key} (use MM:SS).` }
        return { value: parsePaceToSeconds(raw) }
    }

    const fields = {
        swim_distance: parseNumber('swim_distance'),
        swim_time_seconds: parseTime('swim_time'),
        swim_pace_seconds: parsePace('swim_pace'),
        t1_time_seconds: parseTime('t1_time'),
        bike_distance: parseNumber('bike_distance'),
        bike_elevation: parseNumber('bike_elevation'),
        bike_time_seconds: parseTime('bike_time'),
        bike_speed: parseNumber('bike_speed'),
        t2_time_seconds: parseTime('t2_time'),
        run_distance: parseNumber('run_distance'),
        run_time_seconds: parseTime('run_time'),
        run_pace_seconds: parsePace('run_pace'),
        total_time_seconds: parseTime('total_time'),
    }

    // Defense in depth: reject if any provided value failed validation.
    for (const result of Object.values(fields)) {
        if (result.error) return { error: result.error }
    }

    const { error } = await supabase.from('race_results').upsert(
        {
            race_id: raceId,
            user_id: user.id,
            swim_distance: fields.swim_distance.value,
            swim_time_seconds: fields.swim_time_seconds.value,
            swim_pace_seconds: fields.swim_pace_seconds.value,
            t1_time_seconds: fields.t1_time_seconds.value,
            bike_distance: fields.bike_distance.value,
            bike_elevation: fields.bike_elevation.value,
            bike_time_seconds: fields.bike_time_seconds.value,
            bike_speed: fields.bike_speed.value,
            t2_time_seconds: fields.t2_time_seconds.value,
            run_distance: fields.run_distance.value,
            run_time_seconds: fields.run_time_seconds.value,
            run_pace_seconds: fields.run_pace_seconds.value,
            total_time_seconds: fields.total_time_seconds.value,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'race_id' }
    )

    if (error) return dbError('upsertRaceResult', error)

    revalidatePath(`/${raceId}`)
    revalidatePath('/results')
    return { success: true }
}

// Profile Actions

export async function updateProfile(formData: FormData): Promise<ActionResult> {
    const units = formData.get('units') as string
    const theme = formData.get('theme') as string
    const landingPage = formData.get('landing_page') as string

    // Validate against known-good values to prevent injection
    if (!['metric', 'imperial'].includes(units)) return { error: 'Invalid units value.' }
    if (!['light', 'dark'].includes(theme)) return { error: 'Invalid theme value.' }
    if (!['races', 'maintenance', 'results'].includes(landingPage)) return { error: 'Invalid landing page value.' }

    const { supabase, user } = await getAuthenticatedUser()

    const { error } = await supabase.from('profiles').update({
        units: units as 'metric' | 'imperial',
        theme: theme as 'light' | 'dark',
        landing_page: landingPage as 'races' | 'maintenance' | 'results',
    }).eq('id', user.id)

    if (error) return dbError('updateProfile', error)

    // Sync theme to cookie so the root layout can read it without a DB query
    const cookieStore = await cookies()
    cookieStore.set('theme', theme, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    })

    // Do NOT revalidate path to prevent client component remount/snap-back.
    // Client side state is updated optimistically.
    // revalidatePath('/', 'layout')
    return { success: true }
}

export async function updateMaintenanceDefaults(formData: FormData): Promise<ActionResult> {
    const scheduleRaw = formData.get('schedule') as string

    let parsed: Record<string, { first_session: string | null; second_session: string | null }>
    try {
        parsed = JSON.parse(scheduleRaw)
    } catch {
        return { error: 'Invalid schedule data.' }
    }

    const validTypes = new Set<string | null>([...WORKOUT_TYPES, null])

    for (const day of DAY_KEYS) {
        const slot = parsed[day]
        if (!slot || typeof slot !== 'object') continue
        if (!validTypes.has(slot.first_session)) return { error: `Invalid workout type for ${day} 1st session.` }
        if (!validTypes.has(slot.second_session)) return { error: `Invalid workout type for ${day} 2nd session.` }
    }

    const { supabase, user } = await getAuthenticatedUser()

    const { error } = await supabase.from('profiles').update({
        maintenance_defaults: parsed,
    }).eq('id', user.id)

    if (error) return dbError('updateMaintenanceDefaults', error)

    return { success: true }
}

// Maintenance Training Actions

function isValidDateString(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export async function upsertMaintenanceEntry(
    date: string,
    session: MaintenanceSession,
    type: string | null
): Promise<ActionResult> {
    if (!isValidDateString(date)) return { error: 'Invalid date.' }
    if (!MAINTENANCE_SESSIONS.includes(session)) return { error: 'Invalid session.' }
    if (type !== null && !WORKOUT_TYPE_SET.has(type)) return { error: 'Invalid workout type.' }

    const { supabase, user } = await getAuthenticatedUser()

    if (type === null) {
        const { error } = await supabase
            .from('maintenance_entries')
            .delete()
            .eq('user_id', user.id)
            .eq('date', date)
            .eq('session', session)
        if (error) return dbError('upsertMaintenanceEntry (delete)', error)
    } else {
        const { error } = await supabase
            .from('maintenance_entries')
            .upsert(
                { user_id: user.id, date, session, type: type as WorkoutType, updated_at: new Date().toISOString() },
                { onConflict: 'user_id,date,session' }
            )
        if (error) return dbError('upsertMaintenanceEntry (upsert)', error)
    }

    // No revalidatePath: the maintenance page updates optimistically client-side
    // and persists in the background; a re-render here would only cause churn.
    return { success: true }
}

export async function pasteDefaultSchedule(weekStartDate: string): Promise<ActionResult> {
    if (!isValidDateString(weekStartDate)) return { error: 'Invalid week start date.' }

    const { supabase, user } = await getAuthenticatedUser()

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('maintenance_defaults')
        .eq('id', user.id)
        .single()

    if (profileError) return dbError('pasteDefaultSchedule (profile)', profileError)

    const defaults = (profile?.maintenance_defaults || {}) as Record<string, { first_session: string | null; second_session: string | null }>

    // Compute the 7 dates of the week (Mon–Sun) from the Monday weekStartDate.
    const [y, m, d] = weekStartDate.split('-').map(Number)
    const monday = new Date(y, m - 1, d)

    const rowsToUpsert: { user_id: string; date: string; session: MaintenanceSession; type: string }[] = []
    const datesToClear: string[] = []

    for (let i = 0; i < DAY_KEYS.length; i++) {
        const dayDate = new Date(monday)
        dayDate.setDate(monday.getDate() + i)
        const dateStr = toDateString(dayDate)

        const slot = defaults[DAY_KEYS[i]] || { first_session: null, second_session: null }
        for (const session of MAINTENANCE_SESSIONS) {
            const val = slot[session]
            if (val && WORKOUT_TYPE_SET.has(val)) {
                rowsToUpsert.push({ user_id: user.id, date: dateStr, session, type: val })
            }
        }
        datesToClear.push(dateStr)
    }

    // The week becomes an exact copy of the defaults: clear the whole week first,
    // then insert only the populated cells. This also clears cells whose default is empty.
    const { error: deleteError } = await supabase
        .from('maintenance_entries')
        .delete()
        .eq('user_id', user.id)
        .in('date', datesToClear)

    if (deleteError) return dbError('pasteDefaultSchedule (clear)', deleteError)

    if (rowsToUpsert.length > 0) {
        const { error: insertError } = await supabase
            .from('maintenance_entries')
            .insert(rowsToUpsert as Database['public']['Tables']['maintenance_entries']['Insert'][])
        if (insertError) return dbError('pasteDefaultSchedule (insert)', insertError)
    }

    // No revalidatePath: the maintenance page updates optimistically client-side
    // and persists in the background; a re-render here would only cause churn.
    return { success: true }
}

export async function clearMaintenanceWeek(weekStartDate: string): Promise<ActionResult> {
    if (!isValidDateString(weekStartDate)) return { error: 'Invalid week start date.' }

    const { supabase, user } = await getAuthenticatedUser()

    // Compute the 7 dates of the week (Mon–Sun) from the Monday weekStartDate.
    const [y, m, d] = weekStartDate.split('-').map(Number)
    const monday = new Date(y, m - 1, d)
    const dates: string[] = []
    for (let i = 0; i < DAY_KEYS.length; i++) {
        const dd = new Date(monday)
        dd.setDate(monday.getDate() + i)
        dates.push(toDateString(dd))
    }

    const { error } = await supabase
        .from('maintenance_entries')
        .delete()
        .eq('user_id', user.id)
        .in('date', dates)

    if (error) return dbError('clearMaintenanceWeek', error)

    // No revalidatePath: the maintenance page updates optimistically client-side
    // and persists in the background; a re-render here would only cause churn.
    return { success: true }
}

export async function fillRestWeek(weekStartDate: string): Promise<ActionResult> {
    if (!isValidDateString(weekStartDate)) return { error: 'Invalid week start date.' }

    const { supabase, user } = await getAuthenticatedUser()

    // Compute the 7 dates of the week (Mon–Sun) from the Monday weekStartDate.
    const [y, m, d] = weekStartDate.split('-').map(Number)
    const monday = new Date(y, m - 1, d)
    const dates: string[] = []
    for (let i = 0; i < DAY_KEYS.length; i++) {
        const dd = new Date(monday)
        dd.setDate(monday.getDate() + i)
        dates.push(toDateString(dd))
    }

    // Find which (date, session) slots already have an entry, so we only fill gaps
    // and never overwrite a real session.
    const { data: existing, error: fetchError } = await supabase
        .from('maintenance_entries')
        .select('date, session')
        .eq('user_id', user.id)
        .in('date', dates)

    if (fetchError) return dbError('fillRestWeek (fetch)', fetchError)

    const taken = new Set((existing || []).map((e) => `${e.date}|${e.session}`))

    const rowsToInsert: { user_id: string; date: string; session: MaintenanceSession; type: string }[] = []
    for (const date of dates) {
        for (const session of MAINTENANCE_SESSIONS) {
            if (!taken.has(`${date}|${session}`)) {
                rowsToInsert.push({ user_id: user.id, date, session, type: 'Rest' })
            }
        }
    }

    if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('maintenance_entries')
            .upsert(rowsToInsert as Database['public']['Tables']['maintenance_entries']['Insert'][], { onConflict: 'user_id,date,session', ignoreDuplicates: true })
        if (insertError) return dbError('fillRestWeek (insert)', insertError)
    }

    // No revalidatePath: the maintenance page updates optimistically client-side
    // and persists in the background; a re-render here would only cause churn.
    return { success: true }
}

export async function deleteAccount() {
    const supabase = await createClient()

    // Fetch the user first so we can log the event with their ID before deletion.
    // After delete_user() runs, the auth.users row is gone and user_id would be NULL.
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        await logSecurityEvent({
            userId: user.id,
            eventType: 'account_deleted',
            metadata: { email_hash: hashEmail(user.email ?? '') },
        })
    }

    const { error } = await supabase.rpc('delete_user')

    if (error) return dbError('deleteAccount', error)

    await supabase.auth.signOut()
    redirect('/login')
}

export async function updateSecuritySettings(formData: FormData): Promise<ActionResult> {
    const { supabase, user } = await getAuthenticatedUser()

    const newEmail = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string

    const updates: Record<string, string> = {}

    if (newEmail) {
        // Validate email format server-side
        if (!isValidEmail(newEmail)) return { error: 'Please enter a valid email address.' }
        // Compare against the authoritative server-side email, not a client-supplied value
        if (newEmail !== user.email) updates.email = newEmail
    }

    if (password) {
        const passwordError = validatePassword(password)
        if (passwordError) return { error: passwordError }
        updates.password = password
    }

    if (Object.keys(updates).length === 0) {
        return { error: 'No changes to update.' }
    }

    const { error } = await supabase.auth.updateUser(updates)
    if (error) {
        // Supabase auth errors are generally safe to surface (e.g. "New password should be different")
        return { error: error.message }
    }

    // Audit log — log after the successful update so we don't record events for failed attempts
    if ('email' in updates) {
        await logSecurityEvent({
            userId: user.id,
            eventType: 'email_changed',
            metadata: {
                old_email_hash: hashEmail(user.email ?? ''),
                new_email_hash: hashEmail(updates.email!),
            },
        })
    }
    if ('password' in updates) {
        await logSecurityEvent({
            userId: user.id,
            eventType: 'password_changed',
            metadata: {},
        })
    }

    return { success: 'Security settings updated successfully.' }
}

export async function importCsvData(formData: FormData): Promise<ActionResult> {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    // Limit file size to 2 MB to prevent memory exhaustion
    const MAX_FILE_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) return { error: 'File is too large. Maximum size is 2 MB.' }

    // Limit number of rows (workouts) to prevent bulk abuse
    const MAX_ROWS = 500

    const text = await file.text()
    const { data, meta, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })

    if (errors.length > 0) return { error: 'CSV parsing error. Please check format.' }

    const rows = data as Record<string, string>[]
    if (rows.length === 0) return { error: 'CSV is empty.' }
    if (rows.length > MAX_ROWS) return { error: `CSV has too many rows. Maximum is ${MAX_ROWS} workouts per import.` }

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
    let firstDate: Date | null = null
    let lastDate: Date | null = null

    for (let i = 0; i < rows.length; i++) {
        const dStr = rows[i]['Workout Date']?.trim()
        if (dStr) {
            const d = parseDate(dStr)
            if (d) {
                firstDate = new Date(d)
                break
            }
        }
    }

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

    if (firstDate && lastDate) {
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

    // Validate race field lengths
    if (!raceNameRef || raceNameRef.length > LIMITS.NAME) return { error: 'Race Name is required and must be under 255 characters.' }
    if (raceLocationRef && raceLocationRef.length > LIMITS.LOCATION) return { error: 'Race Location must be under 255 characters.' }
    if (raceDetailsRef && raceDetailsRef.length > LIMITS.DETAILS) return { error: 'Race Details must be under 5000 characters.' }

    for (const row of rows) {
        if (row['Race Name']?.trim() !== raceNameRef) return { error: "Race Name should be the same across all rows." }
        if (row['Race Location']?.trim() !== raceLocationRef) return { error: "Race Location should be the same across all rows." }
        if (row['Race Date']?.trim() !== raceDateRef) return { error: "Race Date should be the same across all rows" }
        if (row['Race Details']?.trim() !== raceDetailsRef) return { error: "Race Details should be the same across all rows." }
    }

    // 3. Data Validation per Row
    for (const row of rows) {
        // Workout Date: DD/MM/YYYY
        const wDate = row['Workout Date']?.trim()
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(wDate)) {
            return { error: "Workout Date should be formatted as DD/MM/YYYY." }
        }
        // Validate it's an actual calendar date
        const parsedWDate = parseDate(wDate)
        if (!parsedWDate || isNaN(new Date(parsedWDate).getTime())) {
            return { error: "Workout Date contains an invalid date." }
        }

        // Workout Type
        const wType = row['Workout Type']?.trim()
        if (!WORKOUT_TYPE_SET.has(wType)) {
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

        // Workout Details
        const wDetails = row['Workout Details']?.trim() || ''
        if (wDetails.length > LIMITS.DETAILS) {
            return { error: 'Workout Details must be under 5000 characters.' }
        }
    }

    // 4. Insert Race and Workouts
    const { supabase, user } = await getAuthenticatedUser()

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
        return dbError('importCsvData (race insert)', raceError)
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

    // Drop exact duplicate workouts within the file (same date + type) so a
    // repeated row in the CSV doesn't create two identical sessions.
    const seen = new Set<string>()
    const dedupedWorkouts = workoutsToInsert.filter((w) => {
        const key = `${w.date}|${w.type}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })

    if (dedupedWorkouts.length > 0) {
        const { error: wError } = await supabase.from('workouts').insert(dedupedWorkouts)
        if (wError) {
            return dbError('importCsvData (workouts insert)', wError)
        }
    }

    await logSecurityEvent({
        userId: user.id,
        eventType: 'csv_import',
        metadata: { row_count: dedupedWorkouts.length, race_name: raceNameRef },
    })

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

async function validateWorkoutDate(supabase: Awaited<ReturnType<typeof createClient>>, raceId: string, workoutDate: string) {
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
