"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useFormAction } from "@/components/ui/use-form-action"
import { deleteAccount } from "@/app/actions"

export function DeleteAccountSection() {
    const [showConfirm, setShowConfirm] = useState(false)
    const { isPending, run } = useFormAction()

    const handleDelete = () => {
        // On success this redirects; only a failure returns here (toasted by the hook).
        run(() => deleteAccount())
    }

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Deleting your account will permanently delete all your races and workouts. This cannot be undone.
                </p>

                {showConfirm ? (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-destructive">
                            Are you sure? This action is permanent and cannot be reversed.
                        </p>
                        <div className="flex space-x-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowConfirm(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                isLoading={isPending}
                            >
                                Yes, Delete My Account
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                        Delete Account
                    </Button>
                )}
            </div>
        </section>
    )
}
