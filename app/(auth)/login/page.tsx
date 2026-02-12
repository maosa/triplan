"use client"

import { login } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            const result = await login(formData)
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
                    <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="Please enter your email" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="rememberMe" name="rememberMe" />
                            <label
                                htmlFor="rememberMe"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                            >
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/80">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={isPending}>
                        Log in
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    )
}
