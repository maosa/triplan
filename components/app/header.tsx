"use client"

import Link from "next/link"
import { LogOut, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(auth)/actions"
import { TopNav } from "@/components/app/top-nav"

interface HeaderProps {
    backLink?: string
    backLinkLabel?: string
}

export function Header({ backLink, backLinkLabel = 'Back to Plan' }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                {/* Logo + nav tabs — always top-left, consistent across all pages */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity shrink-0">
                        TriPlan
                    </Link>

                    <TopNav />
                </div>

                <div className="flex items-center gap-2">
                    {/* Optional back link (e.g. "Back to Plan" on the dashboard) — far right */}
                    {backLink && (
                        <Link href={backLink}>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-3">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {backLinkLabel}
                            </Button>
                        </Link>
                    )}

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
