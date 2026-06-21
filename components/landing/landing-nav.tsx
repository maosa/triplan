"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { cn } from "@/lib/utils"

// Transparent top bar that gains a subtle backdrop once the user scrolls past
// the hero, keeping the wordmark and CTAs legible over any section.
export function LandingNav() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 z-50 w-full transition-colors duration-300",
                scrolled
                    ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
                    : "border-b border-transparent"
            )}
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                <Link
                    href="/"
                    className="text-xl font-bold tracking-tight text-foreground"
                >
                    TriPlan
                </Link>

                <div className="flex items-center gap-1 sm:gap-2">
                    <ThemeToggle />
                    <Link href="/login" className="hidden sm:block">
                        <Button variant="ghost" size="sm">
                            Log in
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button size="sm">Get started</Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
