"use client"
import { format, differenceInCalendarDays } from "date-fns"
import { Calendar, MapPin, Pencil, Waves, Bike, Footprints, Dumbbell, BedDouble, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/database"
import { WORKOUT_TYPES } from "@/lib/workout-constants"
import { RACE_TYPE_LABELS, effectiveRaceType } from "@/lib/race-constants"
import { MouseEvent } from "react"

// Only the columns the list, card, and edit modal actually use — lets the
// races query select these explicitly instead of `*`.
export type RaceListItem = Pick<
    Database['public']['Tables']['races']['Row'],
    'id' | 'name' | 'location' | 'date' | 'details' | 'race_type'
>

const WORKOUT_TYPE_ICONS: Record<string, typeof Waves> = {
    Swim: Waves,
    Bike: Bike,
    Run: Footprints,
    Strength: Dumbbell,
    Rest: BedDouble,
    Other: Activity,
}

interface RaceCardProps {
    race: RaceListItem
    onEdit: (race: RaceListItem) => void
    workoutCounts?: Record<string, number>
}

export function RaceCard({ race, onEdit, workoutCounts }: RaceCardProps) {
    const handleEditClick = (e: MouseEvent) => {
        e.preventDefault() // Prevent navigation
        e.stopPropagation()
        onEdit(race)
    }

    const today = new Date()
    const raceDate = new Date(race.date)
    // We use differenceInCalendarDays to ignore time. 
    // If result is 0, it's today. Positive means future.
    const daysLeft = differenceInCalendarDays(raceDate, today)

    return (
        <div
            className="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-5 sm:p-6 transition-all hover:bg-muted/50 hover:border-border/80"
        >
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/${race.id}`} className="focus:outline-none">
                            <span className="absolute inset-0" aria-hidden="true" />
                            {race.name}
                        </Link>
                    </h3>

                    <div className="flex flex-shrink-0 items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="z-10 relative opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity -mt-2 text-muted-foreground hover:text-foreground"
                            onClick={handleEditClick}
                            title="Edit Race"
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit race</span>
                        </Button>
                        {race.race_type && (
                            <span className="relative z-10 whitespace-nowrap text-sm font-normal text-muted-foreground">
                                {RACE_TYPE_LABELS[effectiveRaceType(race.race_type)]}
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Calendar className="mr-1.5 h-4 w-4" />
                            {format(new Date(race.date), "MMM d, yyyy")}
                        </div>
                        {daysLeft < 0 ? (
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ color: 'hsl(78, 85%, 25%)', backgroundColor: 'hsl(78, 85%, 90%)' }}
                            >
                                Race completed
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {daysLeft === 0 ? "Race day" : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                            </span>
                        )}
                    </div>

                    {race.location && (
                        <div className="flex items-center">
                            <MapPin className="mr-1.5 h-4 w-4" />
                            {race.location}
                        </div>
                    )}

                    {workoutCounts && Object.keys(workoutCounts).length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap">
                            {WORKOUT_TYPES.filter(type => workoutCounts[type]).map(type => {
                                const Icon = WORKOUT_TYPE_ICONS[type]
                                return (
                                    <div key={type} className="flex items-center gap-0.5 text-xs text-muted-foreground" title={type}>
                                        <Icon className="h-3.5 w-3.5" />
                                        <span>{workoutCounts[type]}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

