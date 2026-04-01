"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, BarChart2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AddEditWorkoutModal } from "@/components/app/add-workout-modal"
import { getWorkoutIcon } from "@/components/app/workout-icons"
import type { Database } from "@/types/database"
import { format, isSameDay, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { getIntensityColor } from "@/lib/colors"

type Workout = Database['public']['Tables']['workouts']['Row']

function formatDuration(duration: string): string {
    const parts = duration.split(':')
    if (parts.length !== 2) return duration
    const hours = parts[0].padStart(2, '0')
    const minutes = parts[1].padStart(2, '0')
    return `${hours}:${minutes}`
}

interface WorkoutListProps {
    initialWorkouts: Workout[]
    raceId: string
    raceDate: string
    units: string // 'metric' or 'imperial'
}

export function WorkoutList({ initialWorkouts, raceId, raceDate, units }: WorkoutListProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined)

    // Workouts are already sorted by the server (Date DESC, Updated DESC, Created DESC)
    const sortedWorkouts = initialWorkouts

    // Refs for scrolling
    const todayRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (sortedWorkouts.length === 0) return;

        const today = new Date()
        const hasFutureWorkouts = sortedWorkouts.some(w => new Date(w.date) > today && !isSameDay(new Date(w.date), today))

        if (hasFutureWorkouts && todayRef.current) {
            todayRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
    }, [])


    const handleEdit = (workout: Workout) => {
        setEditingWorkout(workout)
        setIsAddModalOpen(true)
    }

    const handleClose = () => {
        setIsAddModalOpen(false)
        setEditingWorkout(undefined)
    }

    return (
        <div className="space-y-6" ref={listRef}>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Workouts</h2>
                <div className="flex items-center gap-2">
                    <Link href={`/${raceId}/dashboard`}>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 sm:px-4">
                            <BarChart2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Button>
                    </Link>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 sm:px-4"
                    >
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add Workout</span>
                    </Button>
                </div>
            </div>

            {sortedWorkouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">No workouts tracked</p>
                    <Button
                        variant="ghost"
                        className="mt-4 text-primary hover:text-primary/80"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Log your first session
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedWorkouts.map((workout) => {
                        const isToday = isSameDay(parseISO(workout.date), new Date())

                        return (
                            <div
                                key={workout.id}
                                ref={isToday && !todayRef.current ? (el) => { if (!todayRef.current) todayRef.current = el } : undefined}
                                data-today={isToday ? "true" : undefined}
                                onClick={() => handleEdit(workout)}
                                className={cn(
                                    "group flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 transition-all hover:bg-muted/50 hover:border-border/80 cursor-pointer",
                                    isToday && "ring-1 ring-primary/20 bg-primary/5"
                                )}
                            >
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
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

                                <div className="flex items-center space-x-1 sm:space-x-6 text-xs sm:text-sm flex-shrink-0">
                                    {/* Duration Slot: Badge */}
                                    <div className="w-14 sm:w-24 flex justify-center">
                                        {workout.duration ? (
                                            <span className="flex items-center justify-center h-6 w-11 bg-muted rounded px-1 text-xs font-mono tracking-tight text-foreground/90">
                                                {formatDuration(workout.duration)}
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center h-6 w-11 text-muted-foreground/30 font-mono">-</span>
                                        )}
                                    </div>

                                    {/* Distance Slot: Text */}
                                    <div className="w-14 sm:w-24 font-mono text-foreground/90 tabular-nums leading-tight flex items-center justify-center h-6">
                                        {workout.distance !== null && workout.distance > 0 ? (
                                            <span className="text-xs">
                                                {workout.distance}<span className="text-muted-foreground text-[10px] ml-[1px]">{units === 'metric' ? 'km' : 'mi'}</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center h-6 w-11 text-muted-foreground/30 font-mono">-</span>
                                        )}
                                    </div>

                                    {/* Intensity Slot: Badge */}
                                    <div className="w-14 sm:w-24 flex justify-center">
                                        {workout.type !== "Rest" && workout.intensity !== null ? (
                                            getIntensityIndicator(workout.intensity)
                                        ) : (
                                            <span className="flex items-center justify-center h-6 w-11 text-muted-foreground/30 font-mono">-</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {isAddModalOpen && (
                <AddEditWorkoutModal
                    isOpen={isAddModalOpen}
                    onClose={handleClose}
                    existingWorkout={editingWorkout}
                    raceId={raceId}
                    raceDate={raceDate}
                    units={units}
                />
            )}
        </div>
    )
}

function getIntensityIndicator(intensity: number | null) {
    if (intensity === null) return null;

    const bgColor = getIntensityColor(intensity);

    // Unified Badge Style: h-6, w-11 (approx 2.75rem) matches Duration
    return (
        <div className="flex justify-end" title={`Intensity: ${intensity}`}>
            <span
                className="flex items-center justify-center h-6 w-11 rounded px-1 text-xs font-mono font-bold text-black tabular-nums"
                style={{ backgroundColor: bgColor }}
            >
                {intensity.toFixed(1)}
            </span>
        </div>
    )
}
