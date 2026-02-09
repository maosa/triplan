"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RaceCard } from "@/components/app/race-card"
import { AddEditRaceModal } from "@/components/app/add-race-modal"
import type { Database } from "@/types/database"

type Race = Database['public']['Tables']['races']['Row']

interface RaceListProps {
    initialRaces: Race[]
}

export function RaceList({ initialRaces }: RaceListProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingRace, setEditingRace] = useState<Race | undefined>(undefined)

    const handleEdit = (race: Race) => {
        setEditingRace(race)
        setIsAddModalOpen(true)
    }

    const handleClose = () => {
        setIsAddModalOpen(false)
        setEditingRace(undefined)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Your Races</h2>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Race
                </Button>
            </div>

            {initialRaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-800 p-12 text-center">
                    <p className="text-gray-400">No races tracked</p>
                    <Button
                        variant="ghost"
                        className="mt-4 text-blue-400 hover:text-blue-300"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Add your first race
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {initialRaces.map((race) => (
                        <RaceCard key={race.id} race={race} onEdit={handleEdit} />
                    ))}
                </div>
            )}

            {isAddModalOpen && (
                <AddEditRaceModal
                    isOpen={isAddModalOpen}
                    onClose={handleClose}
                    existingRace={editingRace}
                />
            )}
        </div>
    )
}
