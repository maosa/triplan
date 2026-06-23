"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import {
    CalendarDays,
    ListChecks,
    Trophy,
    ArrowLeftRight,
    type LucideIcon,
} from "lucide-react"

type Feature = {
    icon: LucideIcon
    title: string
    description: string
}

// Endurance-generic copy so it reads well for triathletes and single-sport
// athletes (running, cycling, swimming) as the app expands.
const features: Feature[] = [
    {
        icon: CalendarDays,
        title: "Races & workouts",
        description:
            "Build each race around its own training plan. Log swim, bike, run, strength and more — with duration, distance and intensity.",
    },
    {
        icon: ListChecks,
        title: "Maintenance planner",
        description:
            "A weekly AM/PM calendar for your base training between races. Paste from a default schedule and stay consistent year-round.",
    },
    {
        icon: Trophy,
        title: "Results tracking",
        description:
            "Record full race-day breakdowns — splits, transitions and totals — and watch your progress build over every event.",
    },
    {
        icon: ArrowLeftRight,
        title: "Import, export & themes",
        description:
            "Bring your history in or take it with you via CSV, switch units, and make it yours with a light or dark theme.",
    },
]

export function Features() {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const section = sectionRef.current
        if (!section) return

        // Respect reduced-motion: leave content visible, skip the animation.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

        const cards = section.querySelectorAll(".feature-card")
        // Hide first (JS is confirmed running), then reveal when the grid scrolls
        // into view. Driving the GSAP tween from an IntersectionObserver avoids
        // ScrollTrigger's stale-position issues with the lazy hero above, and the
        // SSR markup stays visible if JS never runs.
        gsap.set(cards, { y: 32, opacity: 0 })

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return
                    gsap.to(cards, {
                        y: 0,
                        opacity: 1,
                        duration: 0.6,
                        ease: "power2.out",
                        stagger: 0.12,
                    })
                    obs.disconnect()
                })
            },
            { threshold: 0.2 }
        )
        observer.observe(section)

        return () => observer.disconnect()
    }, [])

    return (
        <section
            ref={sectionRef}
            id="features"
            className="relative z-10 container mx-auto px-4 py-20 sm:px-8 sm:py-28"
        >
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Everything your season needs
                </h2>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                    One race-centric home for planning, training and tracking —
                    built for triathletes and endurance athletes.
                </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
                {features.map(({ icon: Icon, title, description }) => (
                    <div
                        key={title}
                        className="feature-card rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                            <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
