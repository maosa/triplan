"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSecuritySettings } from "@/app/actions"
import { useToast } from "@/components/ui/toast"
import { useTransition, useRef } from "react"

export function SecurityForm({ currentEmail }: { currentEmail: string }) {
    const [isPending, startTransition] = useTransition()
    const passwordRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateSecuritySettings(formData)
            if (result?.error) {
                toast(result.error, 'error')
            } else if (result?.success) {
                if (passwordRef.current) passwordRef.current.value = ''
                toast(typeof result.success === 'string' ? result.success : 'Security settings updated successfully.', 'success')
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
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
                </div>
                <Button type="submit" isLoading={isPending}>Update Security Settings</Button>
            </form>
        </div>
    )
}
