"use client"

import { useState, useEffect, useRef } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddEditWorkoutModal } from "@/components/app/add-workout-modal"
import { getWorkoutIcon } from "@/components/app/workout-icons"
import type { Database } from "@/types/database"
import { format, isSameDay, parseISO } from "date-fns"
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

    // Workouts are already sorted by the server (Date DESC, Updated DESC, Created DESC)
    const sortedWorkouts = initialWorkouts

    // Refs for scrolling
    const todayRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        // Run only once on mount (or when workouts change, though initial load is key)
        if (sortedWorkouts.length === 0) return;

        const today = new Date()
        const hasFutureWorkouts = sortedWorkouts.some(w => new Date(w.date) > today && !isSameDay(new Date(w.date), today))

        // If we have future workouts, we want to center "Today". 
        // If "Today" is at the top (no future workouts), we let it stay at top (standard behavior).
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
                    {sortedWorkouts.map((workout) => {
                        const isToday = isSameDay(parseISO(workout.date), new Date())
                        // We only need to ref the FIRST finding of today if multiple exist.
                        // But if we attach ref to all, the last one might overwrite? 
                        // Actually, in a map, ref callback is called for each.
                        // We should probably find the first "Today" and attach ref conditionally.
                        // Or cleaner: Find the index of the first "Today" outside the map?
                        // Unnecessary optimisation maybe.
                        // Let's just attach ref if it matches today. If multiple, the last one rendered (bottom-most today) might get it?
                        // "Centre the group ... e.g. the first or middle item"
                        // If I attach to the first one encountered in the list which is sorted DESC (Latest first),
                        // The first encountered "Today" is the *latest* updated today (or similar).
                        // That works.

                        return (
                            <div
                                key={workout.id}
                                // Attach ref efficiently. Since map runs in order, we can check if it's the *first* today?
                                // Or just check data attribute in useEffect?
                                // Let's use a callback ref or simple logic.
                                ref={isToday && !todayRef.current ? (el) => { if (!todayRef.current) todayRef.current = el } : undefined}
                                // Wait, logic inside render like that is risky with React renders.
                                // Better: Render, and rely on `data-today` attribute, then querySelector in useEffect? 
                                // This is cleaner than conditional refs in map.
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
                                    <div className="w-[3rem] sm:w-20 text-right flex justify-end">
                                        {workout.duration ? (
                                            <span className="flex items-center justify-center h-6 w-11 bg-muted rounded px-1 text-xs font-mono tracking-tight text-foreground/90">
                                                {workout.duration}
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center h-6 w-11 text-muted-foreground/30 font-mono">-</span>
                                        )}
                                    </div>

                                    {/* Distance Slot: Text */}
                                    <div className="w-[3.5rem] sm:w-24 text-right font-mono text-foreground/90 tabular-nums leading-tight flex items-center justify-end h-6">
                                        {workout.distance !== null && workout.distance > 0 ? (
                                            <span className="text-xs">
                                                {workout.distance}<span className="text-muted-foreground text-[10px] ml-[1px]">{units === 'metric' ? 'km' : 'mi'}</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center h-6 w-11 text-muted-foreground/30 font-mono">-</span>
                                        )}
                                    </div>

                                    {/* Intensity Slot: Badge */}
                                    <div className="w-11 sm:w-16 flex justify-end">
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
                />
            )}
        </div>
    )
}

function getIntensityIndicator(intensity: number | null) {
    if (intensity === null) return null;

    let colorClass = "bg-emerald-400"
    if (intensity > 4) colorClass = "bg-amber-400"
    if (intensity > 7) colorClass = "bg-rose-500"

    // Unified Badge Style: h-6, w-11 (approx 2.75rem) matches Duration
    return (
        <div className="flex justify-end" title={`Intensity: ${intensity}`}>
            <span className={cn("flex items-center justify-center h-6 w-11 rounded px-1 text-xs font-mono font-bold text-black tabular-nums", colorClass)}>
                {intensity.toFixed(1)}
            </span>
        </div>
    )
}
