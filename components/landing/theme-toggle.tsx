"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

// Light/dark toggle for the landing page. Mirrors the cookie-writing approach in
// components/app/profile-form.tsx so the choice persists and stays consistent
// with the rest of the app (the root layout + theme-init.js read this cookie).
export function ThemeToggle() {
    // Resolved on mount to match whatever theme-init.js already applied, so the
    // icon reflects reality without causing a hydration mismatch.
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"))
    }, [])

    const toggle = () => {
        const next = isDark ? "light" : "dark"
        if (next === "dark") {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
        document.cookie = `theme=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
        setIsDark(!isDark)
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    )
}
