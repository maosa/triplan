import { startOfISOWeek, addWeeks, format, parseISO } from 'date-fns'
import type { Database } from '@/types/database'

type Workout = Database['public']['Tables']['workouts']['Row']

export type WorkoutType = 'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Other'

export interface WeeklyDataPoint {
    week: string   // formatted label, e.g. "10-Mar-2025"
    value: number  // minutes for duration, raw float for distance, integer for count
}

/** Parse "HH:MM" string to total minutes. Returns 0 for null/empty. */
export function parseHHMM(s: string | null | undefined): number {
    if (!s) return 0
    const parts = s.split(':')
    if (parts.length !== 2) return 0
    const hours = parseInt(parts[0], 10) || 0
    const minutes = parseInt(parts[1], 10) || 0
    return hours * 60 + minutes
}

/** Format total minutes as "HH:MM". */
export function formatMinutesToHHMM(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Get the Monday (start of ISO week) for a given date. */
export function getWeekMonday(date: Date): Date {
    return startOfISOWeek(date)
}

/** Format a date as "DD-Mmm-YYYY", e.g. "10-Mar-2025". */
export function formatWeekLabel(date: Date): string {
    return format(date, 'dd-MMM-yyyy')
}

/**
 * Returns the Monday of the earliest workout (across ALL types) and the Monday
 * of the race week. Used to enforce a consistent x-axis across all chart cells.
 * Returns null if there are no workouts.
 */
export function buildGlobalWeekRange(
    workouts: Workout[],
    raceDate: string
): { from: Date; to: Date } | null {
    if (workouts.length === 0) return null
    const dates = workouts.map(w => parseISO(w.date))
    const earliestMonday = getWeekMonday(new Date(Math.min(...dates.map(d => d.getTime()))))
    const raceMonday = getWeekMonday(parseISO(raceDate))
    return { from: earliestMonday, to: raceMonday }
}

/**
 * Build weekly chart data for a given workout type and field.
 *
 * field:
 *   'duration' — sum of parsed HH:MM values (in minutes)
 *   'distance' — sum of raw distance floats
 *   'count'    — number of matching workouts per week (integer)
 *
 * forcedRange — when provided, the x-axis spans exactly from forcedRange.from
 *   to forcedRange.to (both Mondays). This keeps all charts aligned regardless
 *   of when each workout type first appears in the training plan.
 *   When omitted, the range is derived from the earliest workout of this type.
 *
 * Returns [] (empty array) if there is no data at all for the given type +
 * field combination — the chart cell should be left blank.
 */
export function buildWeeklyData(
    workouts: Workout[],
    type: WorkoutType,
    field: 'duration' | 'distance' | 'count',
    raceDate: string,
    forcedRange?: { from: Date; to: Date }
): WeeklyDataPoint[] {
    const typeWorkouts = workouts.filter(w => w.type === type)

    if (typeWorkouts.length === 0) return []

    // Check if there's any actual data for this field
    if (field !== 'count') {
        const hasData = typeWorkouts.some(w =>
            field === 'duration'
                ? parseHHMM(w.duration) > 0
                : w.distance !== null && w.distance > 0
        )
        if (!hasData) return []
    }

    // Determine week range
    let from: Date
    let to: Date
    if (forcedRange) {
        from = forcedRange.from
        to = forcedRange.to
    } else {
        const dates = typeWorkouts.map(w => parseISO(w.date))
        from = getWeekMonday(new Date(Math.min(...dates.map(d => d.getTime()))))
        to = getWeekMonday(parseISO(raceDate))
    }

    // Build a map of weekLabel → summed/counted value
    const weekMap = new Map<string, number>()

    // Populate all weeks in range with 0
    let cursor = from
    while (cursor <= to) {
        weekMap.set(formatWeekLabel(cursor), 0)
        cursor = addWeeks(cursor, 1)
    }

    // Accumulate values per week
    for (const workout of typeWorkouts) {
        const monday = getWeekMonday(parseISO(workout.date))
        const label = formatWeekLabel(monday)
        if (!weekMap.has(label)) continue // outside range

        const value =
            field === 'duration' ? parseHHMM(workout.duration) :
            field === 'distance' ? (workout.distance ?? 0) :
            /* count */            1

        weekMap.set(label, (weekMap.get(label) ?? 0) + value)
    }

    return Array.from(weekMap.entries()).map(([week, value]) => ({ week, value }))
}
