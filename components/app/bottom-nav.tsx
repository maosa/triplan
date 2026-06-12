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

export function BottomNav() {
  const pathname = usePathname()
  const activeHref = getActiveHref(pathname)

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = activeHref === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
