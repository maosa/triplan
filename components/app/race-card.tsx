"use client"
import { format, differenceInCalendarDays } from "date-fns"
import { Calendar, MapPin, Pencil } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/database"
import { MouseEvent } from "react"

type Race = Database['public']['Tables']['races']['Row']

interface RaceCardProps {
    race: Race
    onEdit: (race: Race) => void
}

export function RaceCard({ race, onEdit }: RaceCardProps) {
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
    const isFuture = daysLeft >= 0

    return (
        <div
            className="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-6 transition-all hover:bg-muted/50 hover:border-border/80"
        >
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/${race.id}`} className="focus:outline-none">
                            <span className="absolute inset-0" aria-hidden="true" />
                            {race.name}
                        </Link>
                    </h3>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="z-10 relative opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2 text-muted-foreground hover:text-foreground"
                        onClick={handleEditClick}
                        title="Edit Race"
                    >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit race</span>
                    </Button>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Calendar className="mr-1.5 h-4 w-4" />
                            {format(new Date(race.date), "MMM d, yyyy")}
                        </div>
                        {isFuture && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {daysLeft === 0 ? "Race Day!" : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                            </span>
                        )}
                    </div>

                    {race.location && (
                        <div className="flex items-center">
                            <MapPin className="mr-1.5 h-4 w-4" />
                            {race.location}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

