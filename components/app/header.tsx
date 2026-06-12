"use client"

import Link from "next/link"
import { LogOut, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logout } from "@/app/(auth)/actions"
import { TopNav } from "@/components/app/top-nav"

interface HeaderProps {
    backLink?: string
    backLinkLabel?: string
    isProfilePage?: boolean
}

export function Header({ backLink, backLinkLabel = 'Back to Races' }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                <div className={cn("flex items-center", backLink ? "gap-4" : "gap-6")}>
                    <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity shrink-0">
                        TriPlan
                    </Link>

                    {/* Top nav on main pages (no back link) — desktop only */}
                    {!backLink && <TopNav />}

                    {backLink && (
                        <Link href={backLink}>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-3">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {backLinkLabel}
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Top nav on detail pages (with back link) moves to the right — desktop only */}
                    {backLink && <TopNav />}

                    <form action={logout} className="flex m-0 p-0">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Log out">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    )
}
