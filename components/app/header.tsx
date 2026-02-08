"use client"

import Link from "next/link"
import { User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(auth)/actions"

export function Header() {
    return (
        <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
                        TriPlan
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/profile">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <User className="mr-2 h-4 w-4" />
                            Account
                        </Button>
                    </Link>
                    <form action={logout}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title="Log out">
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Log out</span>
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    )
}
