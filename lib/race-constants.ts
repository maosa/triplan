import type { RaceType } from '@/types/database'

// Single source of truth for the ordered race types. Drives the Race Type
// dropdown, display labels, results-modal section selection, and server-side
// validation (form posts + CSV import) so they can never drift.
export const RACE_TYPES: readonly RaceType[] = ['swim', 'bike', 'run', 'triathlon']

// Membership check for validating untrusted input (form posts, CSV import).
export const RACE_TYPE_SET: ReadonlySet<string> = new Set(RACE_TYPES)

// Display labels. Stored lowercase; shown title-cased to match the Swim/Bike/Run
// wording used by workout types and icons.
export const RACE_TYPE_LABELS: Record<RaceType, string> = {
    swim: 'Swim',
    bike: 'Bike',
    run: 'Run',
    triathlon: 'Triathlon',
}

// Existing races created before this feature have race_type = null. For display
// logic we treat null/unknown as triathlon so nothing currently shown disappears.
export function effectiveRaceType(t: string | null | undefined): RaceType {
    return t && RACE_TYPE_SET.has(t) ? (t as RaceType) : 'triathlon'
}

// Result sections relevant to a race type, in display order. "Total" is always
// shown and is therefore not listed here. Triathlon keeps the full set including
// transitions; single-sport races show only their discipline.
const SECTIONS_BY_TYPE: Record<RaceType, readonly string[]> = {
    swim: ['swim'],
    bike: ['bike'],
    run: ['run'],
    triathlon: ['swim', 't1', 'bike', 't2', 'run'],
}

export function sectionsForRaceType(t: string | null | undefined): readonly string[] {
    return SECTIONS_BY_TYPE[effectiveRaceType(t)]
}
