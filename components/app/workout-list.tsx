"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddEditWorkoutModal } from "@/components/app/add-workout-modal"
import { getWorkoutIcon } from "@/components/app/workout-icons"
import type { Database } from "@/types/database"
import { format } from "date-fns"
import { cn } from "@/components/ui/button"

type Workout = Database['public']['Tables']['workouts']['Row']

interface WorkoutListProps {
    initialWorkouts: Workout[]
    raceId: string
    raceDate: string
    units: string // 'metric' or 'imperial'
}

export function WorkoutList({ initialWorkouts, raceId, raceDate, units }: WorkoutListProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined)

    const handleEdit = (workout: Workout) => {
        setEditingWorkout(workout)
        setIsAddModalOpen(true)
    }

    const handleClose = () => {
        setIsAddModalOpen(false)
        setEditingWorkout(undefined)
    }

    // Sort workouts by date descending (newest first)? Or ascending (chronological)?
    // Usually training plans are future-facing, so maybe Ascending?
    // "Workout Date (MMM DD–JJJ–YY)".
    // Let's sort Ascending.
    const sortedWorkouts = [...initialWorkouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Workouts</h2>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Workout
                </Button>
            </div>

            {sortedWorkouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">No workouts tracked</p>
                    <Button
                        variant="ghost"
                        className="mt-4 text-blue-400 hover:text-blue-300"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Log your first session
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Header Row for alignment context? Maybe overkill but helps. 
                        Actually prompt asks for "Table-like alignment within the stacked list".
                    */}
                    {sortedWorkouts.map((workout) => (
                        <div
                            key={workout.id}
                            onClick={() => handleEdit(workout)}
                            className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/50 hover:border-border/80 cursor-pointer"
                        >
                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <div className="flex-shrink-0 text-foreground">
                                    {getWorkoutIcon(workout.type)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-foreground truncate">
                                        {format(new Date(workout.date), "EEE, dd MMM yyyy")}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">
                                        {workout.type}
                                        {workout.details && ` • ${workout.details}`}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-6 text-sm flex-shrink-0">
                                {/* Duration Slot: Fixed Width */}
                                <div className="w-20 text-right font-mono text-foreground/90 tabular-nums">
                                    {workout.duration ? (
                                        <span className="bg-muted px-1.5 py-0.5 rounded text-xs">{workout.duration}</span>
                                    ) : (
                                        <span className="text-muted-foreground/30">-</span>
                                    )}
                                </div>

                                {/* Distance Slot: Fixed Width */}
                                <div className="w-24 text-right font-mono text-foreground/90 tabular-nums">
                                    {workout.distance !== null && workout.distance > 0 ? (
                                        <span>
                                            {workout.distance} <span className="text-muted-foreground text-xs">{units === 'metric' ? 'km' : 'mi'}</span>
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground/30 px-4">-</span>
                                    )}
                                </div>

                                {/* Intensity Slot: Fixed Width */}
                                <div className="w-16 flex justify-end">
                                    {workout.type !== "Rest" && workout.intensity !== null ? (
                                        getIntensityIndicator(workout.intensity)
                                    ) : (
                                        <span className="text-muted-foreground/30 w-8 text-center">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isAddModalOpen && (
                <AddEditWorkoutModal
                    isOpen={isAddModalOpen}
                    onClose={handleClose}
                    existingWorkout={editingWorkout}
                    raceId={raceId}
                    raceDate={raceDate}
                />
            )}
        </div>
    )
}

function getIntensityIndicator(intensity: number | null) {
    if (intensity === null) return null;

    let colorClass = "bg-green-500"
    if (intensity > 4) colorClass = "bg-yellow-500"
    if (intensity > 7) colorClass = "bg-red-500"

    return (
        <div className="flex items-center space-x-2" title={`Intensity: ${intensity}`}>
            <span className={cn("h-2 w-2 rounded-full ring-1 ring-offset-1 ring-offset-card ring-transparent", colorClass)} />
            <span className="text-muted-foreground font-mono text-xs w-6 text-right">{intensity.toFixed(1)}</span>
        </div>
    )
}
