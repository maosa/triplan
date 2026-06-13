"use client"

import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { ResultsCard } from "@/components/app/results-card"
import { RaceResultsModal } from "@/components/app/race-results-modal"
import type { Database } from "@/types/database"

type Race = Database['public']['Tables']['races']['Row']
type RaceResult = Database['public']['Tables']['race_results']['Row']

type SortOrder = 'newest' | 'oldest'

interface ResultsListProps {
    races: Race[]
    results: Record<string, RaceResult>
    units: string // 'metric' or 'imperial'
}

export function ResultsList({ races, results, units }: ResultsListProps) {
    const [editingRace, setEditingRace] = useState<Race | null>(null)
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

    const handleEdit = (race: Race) => setEditingRace(race)
    const handleClose = () => setEditingRace(null)

    // Races arrive newest-first from the server; sort a copy by date per the toggle.
    const sortedRaces = useMemo(() => {
        return [...races].sort((a, b) => {
            const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
            return sortOrder === 'newest' ? -diff : diff
        })
    }, [races, sortOrder])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-foreground">Race Results</h2>

                {races.length > 0 && (
                    <div className="relative">
                        <select
                            aria-label="Sort race results"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                            className="flex h-10 appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                )}
            </div>

            {races.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">
                        No completed races yet — results will appear here once a race date has passed.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedRaces.map((race) => (
                        <ResultsCard
                            key={race.id}
                            race={race}
                            result={results[race.id] ?? null}
                            units={units}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

            {editingRace && (
                <RaceResultsModal
                    isOpen={!!editingRace}
                    onClose={handleClose}
                    raceId={editingRace.id}
                    raceName={editingRace.name}
                    existingResult={results[editingRace.id] ?? null}
                    units={units}
                />
            )}
        </div>
    )
}
