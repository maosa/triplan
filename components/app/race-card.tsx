"use client"

import { format } from "date-fns"
import { Calendar, MapPin, MoreVertical } from "lucide-react"
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

    return (
        <Link
            href={`/${race.id}`}
            className="group block rounded-lg border border-gray-800 bg-gray-900/50 p-6 transition-all hover:bg-gray-800/50 hover:border-gray-700 relative"
        >
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {race.name}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                            <Calendar className="mr-1.5 h-4 w-4" />
                            {format(new Date(race.date), "MMM d, yyyy")}
                        </div>
                        {race.location && (
                            <div className="flex items-center">
                                <MapPin className="mr-1.5 h-4 w-4" />
                                {race.location}
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2 text-gray-400 hover:text-white"
                    onClick={handleEditClick}
                >
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Edit race</span>
                </Button>
            </div>
        </Link>
    )
}
