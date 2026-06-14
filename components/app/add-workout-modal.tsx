"use client"

import { useState, useTransition } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createWorkout, updateWorkout, deleteWorkout, duplicateWorkout } from "@/app/actions"
import type { Database, WorkoutType } from "@/types/database"
import { getDiscreteGradient } from "@/lib/colors"
import { WORKOUT_TYPES } from "@/lib/workout-constants"

type Workout = Database['public']['Tables']['workouts']['Row']

interface AddEditWorkoutModalProps {
    isOpen: boolean
    onClose: () => void
    existingWorkout?: Workout
    raceId: string
    raceDate: string
    units?: string
}

export function AddEditWorkoutModal({ isOpen, onClose, existingWorkout, raceId, raceDate, units }: AddEditWorkoutModalProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [durationError, setDurationError] = useState<string | null>(null)
    const [confirmAction, setConfirmAction] = useState<'delete' | null>(null)

    // Local state for Type to handle Rest logic. These initialize from
    // existingWorkout on mount; the modal is keyed by workout id at the call
    // site so it remounts (and re-initializes) whenever the target changes.
    const [type, setType] = useState(existingWorkout?.type || "Swim")
    const [intensity, setIntensity] = useState(existingWorkout?.intensity ?? 5)

    const handleClose = () => {
        setConfirmAction(null)
        setError(null)
        setDurationError(null)
        onClose()
    }

    const validateDuration = (value: string): boolean => {
        if (!value) return true // optional field
        return /^\d+:[0-5]\d$/.test(value)
    }

    const handleDurationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value.trim()
        if (value && !validateDuration(value)) {
            setDurationError('Please enter duration as HH:MM (e.g. 01:30)')
        } else {
            setDurationError(null)
        }
    }

    // Handle Type change
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value
        setType(newType as WorkoutType)
        if (newType === "Rest") {
            setIntensity(0)
        }
    }

    async function handleSubmit(formData: FormData) {
        setError(null)
        const date = formData.get("date") as string
        const duration = ((formData.get("duration") as string) || '').trim()

        // Client-side date validation
        if (new Date(date) > new Date(raceDate)) {
            setError("Date cannot be after race date.")
            return
        }

        // Client-side duration validation
        if (duration && !validateDuration(duration)) {
            setDurationError('Please enter duration as HH:MM (e.g. 01:30)')
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
                handleClose()
            }
        })
    }

    async function handleDeleteConfirm() {
        if (!existingWorkout) return

        startTransition(async () => {
            const result = await deleteWorkout(existingWorkout.id, raceId)
            if (result?.error) {
                setError(result.error)
                setConfirmAction(null)
            } else {
                handleClose()
            }
        })
    }

    async function handleDuplicate() {
        if (!existingWorkout) return

        startTransition(async () => {
            const result = await duplicateWorkout(existingWorkout)
            if (result?.error) {
                setError(result.error)
            } else {
                handleClose()
            }
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={existingWorkout ? "Edit Workout" : "Add Workout"}>
            {confirmAction === 'delete' ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this workout? This cannot be undone.
                    </p>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="ghost" onClick={() => setConfirmAction(null)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteConfirm} isLoading={isPending}>
                            Delete Workout
                        </Button>
                    </div>
                </div>
            ) : (
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
                            <Select
                                id="type"
                                name="type"
                                value={type}
                                onChange={handleTypeChange}
                            >
                                {WORKOUT_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </Select>
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
                                onBlur={handleDurationBlur}
                                onChange={() => setDurationError(null)}
                            />
                            {durationError && <p className="text-destructive text-xs">{durationError}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="distance">Distance ({units === 'imperial' ? 'mi' : 'km'})</Label>
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
                            <Label htmlFor="intensity">Intensity ({intensity.toFixed(1)})</Label>
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
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                            style={{
                                background: type === "Rest" ? undefined : getDiscreteGradient()
                            }}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>Easy</span>
                            <span>Moderate</span>
                            <span>Hard</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details">Details</Label>
                        <Textarea
                            id="details"
                            name="details"
                            defaultValue={existingWorkout?.details || ''}
                            placeholder="Intervals, focus points..."
                            rows={3}
                        />
                    </div>

                    {error && <p className="text-destructive text-sm">{error}</p>}

                    <div className="flex justify-between pt-4">
                        <div className="flex space-x-2">
                            {existingWorkout && (
                                <>
                                    <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmAction('delete')} disabled={isPending}>
                                        Delete
                                    </Button>
                                    <Button type="button" variant="secondary" size="sm" onClick={handleDuplicate} disabled={isPending}>
                                        Duplicate
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="flex space-x-2">
                            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isPending}>
                                Save
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    )
}
