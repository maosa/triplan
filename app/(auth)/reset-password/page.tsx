"use client"

import { updatePassword } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"

export default function ResetPasswordPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            const result = await updatePassword(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground relative">
            {/* Standard Header Logo Position */}
            <div className="absolute top-0 left-0 w-full border-b border-transparent">
                <div className="container mx-auto flex h-16 items-center px-4 sm:px-8">
                    <span className="text-xl font-bold tracking-tight text-foreground">TriPlan</span>
                </div>
            </div>

            <div className="w-full max-w-md space-y-8 px-4 pt-16">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Set New Password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Enter your new password below</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" name="password" type="password" required placeholder="At least 6 characters" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" required />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={isPending}>
                        Update Password
                    </Button>
                </form>
            </div>
        </div>
    )
}
