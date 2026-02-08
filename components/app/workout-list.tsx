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
                <h2 className="text-lg font-semibold text-white">Workouts</h2>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-white text-black hover:bg-gray-200">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Workout
                </Button>
            </div>

            {sortedWorkouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-800 p-12 text-center">
                    <p className="text-gray-400">No workouts tracked</p>
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
                    {sortedWorkouts.map((workout) => (
                        <div
                            key={workout.id}
                            onClick={() => handleEdit(workout)}
                            className="group flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition-all hover:bg-gray-800/50 hover:border-gray-700 cursor-pointer"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    {getWorkoutIcon(workout.type)}
                                </div>
                                <div>
                                    <div className="font-medium text-white">
                                        {format(new Date(workout.date), "EEE, MMM d")}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {workout.type}
                                        {workout.details && ` • ${workout.details}`}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm">
                                {workout.duration && (
                                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                                        {workout.duration}
                                    </span>
                                )}
                                {/* Only show distance if relevant types? Bike/Run/Swim usually. */}
                                {workout.distance !== null && workout.distance > 0 && (
                                    <span className="text-gray-300">
                                        {workout.distance} {units === 'metric' ? 'km' : 'mi'}
                                    </span>
                                )}

                                {/* Intensity Indicator */}
                                {workout.type !== "Rest" && getIntensityIndicator(workout.intensity)}
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

    // Simple color coding logic
    let colorClass = "bg-green-500"
    if (intensity > 4) colorClass = "bg-yellow-500"
    if (intensity > 7) colorClass = "bg-red-500"

    return (
        <div className="flex items-center space-x-1" title={`Intensity: ${intensity}`}>
            <span className={cn("h-2 w-2 rounded-full", colorClass)} />
            <span className="text-gray-500 text-xs">{intensity}</span>
        </div>
    )
}
