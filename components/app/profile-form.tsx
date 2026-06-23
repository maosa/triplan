"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useFormAction } from "@/components/ui/use-form-action"
import { updateProfile } from "@/app/actions"
import { useState } from "react"
import type { Database } from "@/types/database"

// Only the preference columns this form reads (the page selects these explicitly).
type Profile = Pick<Database['public']['Tables']['profiles']['Row'], 'units' | 'theme' | 'landing_page'>

export function ProfileForm({ profile }: { profile: Profile | null }) {
    const [theme, setTheme] = useState(profile?.theme || 'dark')
    const [units, setUnits] = useState(profile?.units || 'metric')
    const [landingPage, setLandingPage] = useState(profile?.landing_page || 'races')
    const { isPending, run } = useFormAction()

    const handleSubmit = (formData: FormData) => {
        run(() => updateProfile(formData), {
            successMessage: 'Your preferences have been saved.',
            onSuccess: () => {
                const newTheme = formData.get('theme') as Profile['theme']
                const newUnits = formData.get('units') as Profile['units']
                const newLandingPage = formData.get('landing_page') as Profile['landing_page']

                // Apply theme class immediately + sync the cookie the root layout reads.
                document.documentElement.classList.toggle('dark', newTheme === 'dark')
                document.cookie = `theme=${newTheme};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`

                setTheme(newTheme)
                setUnits(newUnits)
                setLandingPage(newLandingPage)
            },
        })
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                handleSubmit(new FormData(e.currentTarget))
            }}
            className="rounded-lg border border-border bg-card p-6 space-y-6"
        >
            <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Select
                    id="units"
                    name="units"
                    value={units}
                    onChange={(e) => setUnits(e.target.value as Profile['units'])}
                >
                    <option value="metric">Metric (km)</option>
                    <option value="imperial">Imperial (mi)</option>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                    id="theme"
                    name="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as Profile['theme'])}
                >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="landing_page">Landing Page</Label>
                <Select
                    id="landing_page"
                    name="landing_page"
                    value={landingPage}
                    onChange={(e) => setLandingPage(e.target.value as Profile['landing_page'])}
                >
                    <option value="races">My Races</option>
                    <option value="maintenance">Maintenance Training</option>
                    <option value="results">Race Results</option>
                </Select>
            </div>

            <Button type="submit" isLoading={isPending}>Save Preferences</Button>
        </form>
    )
}
