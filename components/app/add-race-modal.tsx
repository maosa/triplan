"use client"

import { useState, useTransition } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createRace, deleteRace, updateRace } from "@/app/actions"
// We would import the Race type here if shared, or define partial
import type { Database } from "@/types/database"

type Race = Database['public']['Tables']['races']['Row']

interface AddEditRaceModalProps {
    isOpen: boolean
    onClose: () => void
    existingRace?: Race
}

export function AddEditRaceModal({ isOpen, onClose, existingRace }: AddEditRaceModalProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            let result
            if (existingRace) {
                result = await updateRace(existingRace.id, formData)
            } else {
                result = await createRace(formData)
            }

            if (result?.error) {
                setError(result.error)
            } else {
                onClose()
            }
        })
    }

    async function handleDelete() {
        if (!existingRace) return;
        if (!confirm("Deleting this race will permanently delete all associated workouts. Continue?")) return;

        startTransition(async () => {
            const result = await deleteRace(existingRace.id)
            if (result?.error) {
                setError(result.error)
            } else {
                onClose()
            }
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingRace ? "Edit Race" : "Add Race"}>
            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Race Name</Label>
                    <Input
                        id="name"
                        name="name"
                        required
                        defaultValue={existingRace?.name}
                        placeholder="Ironman 70.3"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        name="location"
                        defaultValue={existingRace?.location || ''}
                        placeholder="City, Country"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        required
                        defaultValue={existingRace?.date}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="details">Details (Optional)</Label>
                    <Input
                        id="details"
                        name="details"
                        defaultValue={existingRace?.details || ''}
                        placeholder="Goals, notes..."
                    />
                    {/* Using Input for simplicity, ideally Textarea but prompt didn't strictly require it */}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-between pt-4">
                    {existingRace ? (
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                            Delete
                        </Button>
                    ) : <div />} {/* Spacer */}

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
