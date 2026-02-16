"use client"

import Link from "next/link"
import { User, LogOut, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(auth)/actions"

interface HeaderProps {
    backLink?: string
    isProfilePage?: boolean
}

export function Header({ backLink, isProfilePage = false }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
                        TriPlan
                    </Link>

                    {backLink && (
                        <Link href={backLink}>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-3">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Races
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/profile">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={isProfilePage ? "text-foreground bg-accent/50" : "text-muted-foreground hover:text-foreground"}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Account
                        </Button>
                    </Link>
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
