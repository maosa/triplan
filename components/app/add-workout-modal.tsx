"use client"

import { useState, useTransition, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWorkout, updateWorkout, deleteWorkout, duplicateWorkout } from "@/app/actions"
import type { Database } from "@/types/database"
import { format } from "date-fns"

type Workout = Database['public']['Tables']['workouts']['Row']

interface AddEditWorkoutModalProps {
    isOpen: boolean
    onClose: () => void
    existingWorkout?: Workout
    raceId: string
    raceDate: string
}

const WORKOUT_TYPES = ["Swim", "Bike", "Run", "Strength", "Rest", "Stretching", "Other"]

export function AddEditWorkoutModal({ isOpen, onClose, existingWorkout, raceId, raceDate }: AddEditWorkoutModalProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Local state for Type to handle Rest logic
    const [type, setType] = useState(existingWorkout?.type || "Swim")
    const [intensity, setIntensity] = useState(existingWorkout?.intensity ?? 5)

    useEffect(() => {
        if (existingWorkout) {
            setType(existingWorkout.type)
            setIntensity(existingWorkout.intensity ?? 5)
        } else {
            setType("Swim")
            setIntensity(5)
        }
    }, [existingWorkout, isOpen])

    // Handle Type change
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value
        setType(newType as any)
        if (newType === "Rest") {
            setIntensity(0)
        }
    }

    async function handleSubmit(formData: FormData) {
        setError(null)
        const date = formData.get("date") as string

        // Client-side date validation
        if (new Date(date) > new Date(raceDate)) {
            setError("Date cannot be after race date.")
            return
        }

        startTransition(async () => {
            let result
            if (existingWorkout) {
                result = await updateWorkout(existingWorkout.id, raceId, formData)
            } else {
                result = await createWorkout(raceId, formData)
            }

            if (result?.error) {
                setError(result.error)
            } else {
                onClose()
            }
        })
    }

    async function handleDelete() {
        if (!existingWorkout) return;
        if (!confirm("Are you sure you want to delete this workout?")) return;

        startTransition(async () => {
            const result = await deleteWorkout(existingWorkout.id, raceId)
            if (result?.error) {
                setError(result.error)
            } else {
                onClose()
            }
        })
    }

    async function handleDuplicate() {
        if (!existingWorkout) return;

        startTransition(async () => {
            const result = await duplicateWorkout(existingWorkout)
            if (result?.error) {
                setError(result.error)
            } else {
                onClose()
            }
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingWorkout ? "Edit Workout" : "Add Workout"}>
            <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            required
                            max={raceDate}
                            defaultValue={existingWorkout?.date || new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <select
                            id="type"
                            name="type"
                            className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={type}
                            onChange={handleTypeChange}
                        >
                            {WORKOUT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (HH:MM)</Label>
                        <Input
                            id="duration"
                            name="duration"
                            placeholder="00:00"
                            disabled={type === "Rest"}
                            defaultValue={existingWorkout?.duration || ''}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="distance">Distance (km)</Label>
                        <Input
                            id="distance"
                            name="distance"
                            type="number"
                            step="0.01"
                            placeholder="0"
                            disabled={type === "Rest"}
                            defaultValue={existingWorkout?.distance || ''}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="intensity">Intensity ({intensity})</Label>
                    </div>
                    <input
                        id="intensity"
                        name="intensity"
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        disabled={type === "Rest"}
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        style={{
                            background: type === "Rest" ? undefined : `linear-gradient(to right, #4ade80 0%, #facc15 50%, #ef4444 100%)`
                        }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>Easy</span>
                        <span>Moderate</span>
                        <span>Hard</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="details">Details</Label>
                    <Input
                        id="details"
                        name="details"
                        defaultValue={existingWorkout?.details || ''}
                        placeholder="Intervals, focus points..."
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-between pt-4">
                    <div className="flex space-x-2">
                        {existingWorkout && (
                            <>
                                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                                    Delete
                                </Button>
                                <Button type="button" variant="secondary" size="sm" onClick={handleDuplicate} disabled={isPending}>
                                    Duplicate
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isPending}>
                            Save
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
