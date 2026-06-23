"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSecuritySettings } from "@/app/actions"
import { useFormAction } from "@/components/ui/use-form-action"
import { useRef } from "react"

export function SecurityForm({ currentEmail }: { currentEmail: string }) {
    const passwordRef = useRef<HTMLInputElement>(null)
    const { isPending, run } = useFormAction()

    const handleSubmit = (formData: FormData) => {
        run(() => updateSecuritySettings(formData), {
            successMessage: 'Security settings updated successfully.',
            onSuccess: () => { if (passwordRef.current) passwordRef.current.value = '' },
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
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
                </div>
                <Button type="submit" isLoading={isPending}>Update Security Settings</Button>
            </form>
        </div>
    )
}
