import { Waves, Bike, Footprints, Dumbbell, BedDouble, Activity, type LucideIcon } from 'lucide-react'
import { type WorkoutType } from '@/types/database'
import { WORKOUT_TYPES } from '@/lib/workout-constants'

export type WorkoutCellType = WorkoutType

export const MAINTENANCE_TYPE_STYLES: Record<WorkoutCellType, { badge: string; icon: LucideIcon }> = {
  Swim:     { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',         icon: Waves },
  Bike:     { badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',     icon: Bike },
  Run:      { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', icon: Footprints },
  Strength: { badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',             icon: Dumbbell },
  Rest:     { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',         icon: BedDouble },
  Other:    { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300', icon: Activity },
}

export const MAINTENANCE_TYPE_ORDER: readonly WorkoutCellType[] = WORKOUT_TYPES
