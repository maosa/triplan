"use client"

import { useState, useTransition } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createRace, deleteRace, updateRace } from "@/app/actions"
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
    const [confirmAction, setConfirmAction] = useState<'delete' | null>(null)

    const handleClose = () => {
        setConfirmAction(null)
        setError(null)
        onClose()
    }

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
                handleClose()
            }
        })
    }

    async function handleDeleteConfirm() {
        if (!existingRace) return

        startTransition(async () => {
            const result = await deleteRace(existingRace.id)
            if (result?.error) {
                setError(result.error)
                setConfirmAction(null)
            } else {
                handleClose()
            }
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={existingRace ? "Edit Race" : "Add Race"}>
            {confirmAction === 'delete' ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Deleting this race will permanently delete all associated workouts. This cannot be undone.
                    </p>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="ghost" onClick={() => setConfirmAction(null)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteConfirm} isLoading={isPending}>
                            Delete Race
                        </Button>
                    </div>
                </div>
            ) : (
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
                        <textarea
                            id="details"
                            name="details"
                            defaultValue={existingRace?.details || ''}
                            placeholder="Goals, notes..."
                            rows={3}
                            className="flex w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[80px]"
                        />
                    </div>

                    {error && <p className="text-destructive text-sm">{error}</p>}

                    <div className="flex justify-between pt-4">
                        {existingRace ? (
                            <Button type="button" variant="destructive" onClick={() => setConfirmAction('delete')} disabled={isPending}>
                                Delete
                            </Button>
                        ) : <div />}

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
