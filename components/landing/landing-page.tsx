"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/app/footer"
import { LandingNav } from "./landing-nav"
import { Features } from "./features"

// Lazy, browser-only — three.js never runs on the server and never blocks
// first paint. While it loads (or when motion is reduced) the gradient backdrop
// below stands in for it.
const HeroCanvas = dynamic(
    () => import("./hero-canvas").then((m) => m.HeroCanvas),
    { ssr: false }
)

export function LandingPage() {
    const [showCanvas, setShowCanvas] = useState(false)

    useEffect(() => {
        // Only animate when the visitor hasn't asked for reduced motion.
        const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        setShowCanvas(!reduce)
    }, [])

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <LandingNav />

            <main className="flex-1">
                {/* Hero */}
                <section className="relative flex min-h-screen items-center overflow-hidden">
                    {/* Subtle ambient glow — also the reduced-motion fallback */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,color-mix(in_srgb,var(--foreground)_8%,transparent),transparent)]"
                    />
                    {showCanvas && <HeroCanvas />}
                    {/* Center scrim: mutes the particle field behind the copy so
                        the headline stays crisp while particles read at the edges.
                        Stronger/larger on phones — the copy block is taller and the
                        particles bigger there, so the desktop scrim isn't enough. */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_92%_60%_at_50%_50%,var(--background)_55%,transparent_92%)] sm:bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,var(--background)_28%,transparent_72%)]"
                    />

                    <div className="container relative z-10 mx-auto px-4 py-24 sm:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                                Plan every race.
                                <br className="hidden sm:block" /> Train with
                                purpose.
                            </h1>
                            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                                TriPlan is the home for your endurance season —
                                plan races, structure your training, and track
                                every result in one focused place.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <Link href="/signup" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        Get started — it&apos;s free
                                    </Button>
                                </Link>
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                    >
                                        Log in
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <Features />

                {/* CTA band */}
                <section className="border-t border-border">
                    <div className="container mx-auto px-4 py-20 text-center sm:px-8 sm:py-28">
                        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Ready to take control of your season?
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                            Create a free account and plan your next race in
                            minutes.
                        </p>
                        <div className="mt-8">
                            <Link href="/signup">
                                <Button size="lg">Get started</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
