"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// A gentle down-arrow at the bottom of the hero that signals "there's more
// below". Only shown while the visitor is at the very top of the page (on load,
// refresh, or after scrolling back up); it fades out as soon as they scroll.
// Clicking it smooth-scrolls the features section to the top of the viewport.
export function ScrollHint() {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY < 24)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    const scrollToFeatures = () => {
        const el = document.getElementById("features")
        if (!el) return
        const absTop = window.scrollY + el.getBoundingClientRect().top
        const vh = window.innerHeight
        // When the features section is shorter than the viewport, align its
        // bottom to the viewport bottom so the next section (the CTA) stays just
        // off-screen, while keeping the heading as high as it can be. If it's
        // taller than the viewport, just align its top.
        const target =
            el.offsetHeight < vh ? absTop + el.offsetHeight - vh : absTop
        window.scrollTo({ top: Math.max(0, target), behavior: "smooth" })
    }

    return (
        <button
            type="button"
            onClick={scrollToFeatures}
            aria-label="Scroll to features"
            className={cn(
                "absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full p-2 text-muted-foreground transition-opacity duration-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                visible ? "opacity-100" : "pointer-events-none opacity-0"
            )}
        >
            <ChevronDown className="scroll-hint-bob h-6 w-6" />
        </button>
    )
}
