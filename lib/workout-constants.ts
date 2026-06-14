import type { WorkoutType, MaintenanceSession } from '@/types/database'

// Single source of truth for the ordered workout types. Drives the workout-type
// dropdown, icon/badge maps, and server-side validation so they can never drift.
export const WORKOUT_TYPES: readonly WorkoutType[] = ['Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other']

// Membership check for validating untrusted input (CSV import, form posts).
export const WORKOUT_TYPE_SET: ReadonlySet<string> = new Set(WORKOUT_TYPES)

// The two daily maintenance slots, in display order.
export const MAINTENANCE_SESSIONS: readonly MaintenanceSession[] = ['first_session', 'second_session']

// Weekday keys (Mon–Sun) used by the maintenance grid and defaults schedule.
export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type DayKey = (typeof DAY_KEYS)[number]
