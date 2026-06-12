"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flag, CalendarDays, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: '/races', label: 'Races', icon: Flag },
  { href: '/maintenance', label: 'Maintenance', icon: CalendarDays },
  { href: '/results', label: 'Results', icon: Trophy },
  { href: '/profile', label: 'Account', icon: User },
] as const

function getActiveHref(pathname: string): string {
  if (pathname === '/profile') return '/profile'
  if (pathname === '/maintenance') return '/maintenance'
  if (pathname === '/results') return '/results'
  // /races, /[raceId], /[raceId]/dashboard all map to Races
  return '/races'
}

export function TopNav() {
  const pathname = usePathname()
  const activeHref = getActiveHref(pathname)

  return (
    <nav className="hidden sm:flex items-end gap-1 h-16">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = activeHref === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 h-full text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
