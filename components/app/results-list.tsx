"use client"

import { useState } from "react"
import { ResultsCard } from "@/components/app/results-card"
import { RaceResultsModal } from "@/components/app/race-results-modal"
import type { Database } from "@/types/database"

type Race = Database['public']['Tables']['races']['Row']
type RaceResult = Database['public']['Tables']['race_results']['Row']

interface ResultsListProps {
    races: Race[]
    results: Record<string, RaceResult>
    units: string // 'metric' or 'imperial'
}

export function ResultsList({ races, results, units }: ResultsListProps) {
    const [editingRace, setEditingRace] = useState<Race | null>(null)

    const handleEdit = (race: Race) => setEditingRace(race)
    const handleClose = () => setEditingRace(null)

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Race Results</h2>

            {races.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">
                        No completed races yet — results will appear here once a race date has passed.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {races.map((race) => (
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
