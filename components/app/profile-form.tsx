"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateProfile } from "@/app/actions"
import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

export function ProfileForm({ profile }: { profile: any }) {
    const [isPending, startTransition] = useTransition()
    const [theme, setTheme] = useState(profile?.theme || 'dark')
    const [units, setUnits] = useState(profile?.units || 'metric')

    // Optimistic toggle for theme?
    // We need to apply theme class to document.
    // Ideally this is handled by a ThemeProvider, but simple imperative logic works for MVP.

    const [success, setSuccess] = useState(false)

    const handleSubmit = (formData: FormData) => {
        setSuccess(false)
        startTransition(async () => {
            const result = await updateProfile(formData)
            if (result?.success) {
                // Force refresh to apply theme if server-rendered layout depends on it
                // Or manually toggle class
                const newTheme = formData.get('theme') as string
                const newUnits = formData.get('units') as string

                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
                setTheme(newTheme)
                setUnits(newUnits)
                setSuccess(true)
                // Hide success message after 3 seconds
                setTimeout(() => setSuccess(false), 3000)
            }
        })
    }

    return (
        <form action={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-6">
            <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <div className="relative">
                    <select
                        id="units"
                        name="units"
                        value={units}
                        onChange={(e) => setUnits(e.target.value)}
                        className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="metric">Metric (km)</option>
                        <option value="imperial">Imperial (mi)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <div className="relative">
                    <select
                        id="theme"
                        name="theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            <Button type="submit" isLoading={isPending}>Save Preferences</Button>

            {success && (
                <div className="text-sm font-medium text-green-500 animate-in fade-in slide-in-from-top-2">
                    Your preferences have been saved.
                </div>
            )}
        </form>
    )
}
