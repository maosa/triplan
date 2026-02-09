"use client"

import { signup } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useTransition } from "react"

export default function SignupPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        setSuccess(null)
        startTransition(async () => {
            const result = await signup(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.success) {
                setSuccess(result.success)
            }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md space-y-8 px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Create an account</h1>
                    <p className="mt-2 text-sm text-gray-400">Start planning your race</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input id="firstName" name="firstName" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input id="lastName" name="lastName" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-green-500">
                            {success}
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={isPending}>
                        Sign up
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    )
}
