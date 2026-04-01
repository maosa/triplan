"use client"

import Link from "next/link"
import { resetPassword } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        setSuccess(null)
        startTransition(async () => {
            const result = await resetPassword(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.success) {
                setSuccess(result.success)
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset Password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Enter your email to receive a reset link</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="email@domain.com" />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm font-medium text-green-500">
                            {success}
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={isPending}>
                        Send Reset Link
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    )
}
