"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSecuritySettings } from "@/app/actions"
import { useTransition, useState, useRef } from "react"

export function SecurityForm({ currentEmail }: { currentEmail: string }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const passwordRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (formData: FormData) => {
        setError(null)
        setSuccess(false)
        startTransition(async () => {
            const result = await updateSecuritySettings(currentEmail, formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.success) {
                setSuccess(true)
                if (passwordRef.current) passwordRef.current.value = ''
                setTimeout(() => setSuccess(false), 3000)
            }
        })
    }

    return (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
                To change your email or password, please use the update form below.
                Note: Changing email may require confirmation.
            </p>
            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={currentEmail} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Leave blank to keep current" ref={passwordRef} />
                </div>
                <Button type="submit" isLoading={isPending}>Update Security Settings</Button>

                {error && (
                    <div className="text-sm text-destructive">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="text-sm font-medium text-green-500 animate-in fade-in slide-in-from-top-2">
                        Security settings updated successfully.
                    </div>
                )}
            </form>
        </div>
    )
}
