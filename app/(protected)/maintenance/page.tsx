import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/app/header'
import { MaintenanceWeekView } from '@/components/app/maintenance-week-view'
import { getWeekStart, parseDateString, toDateString } from '@/lib/date-utils'
import { subWeeks, addWeeks } from 'date-fns'
import type { MaintenanceDefaults } from '@/types/database'

// ±1 year window (~728 rows max, well under Supabase's 1000-row page cap, and far
// more than anyone navigates). The client lazily extends this as needed.
const WINDOW_WEEKS = 52

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { week } = await searchParams

  // Resolve the displayed week's Monday: from ?week=YYYY-MM-DD if valid, else current week.
  const requested = parseDateString(week)
  const weekStartDate = getWeekStart(requested ?? new Date())
  const weekStart = toDateString(weekStartDate)

  // Load a bounded date window around the displayed week (not "all rows"), so the
  // query is always a small range scan — cap-proof and constant-cost regardless of
  // how much history accumulates. The client navigates instantly within this window
  // and extends it in the background near the edges.
  const loadedFrom = toDateString(subWeeks(weekStartDate, WINDOW_WEEKS))
  const loadedTo = toDateString(addWeeks(weekStartDate, WINDOW_WEEKS + 1)) // +1wk pads the Sunday edge

  const [{ data: profile }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from('profiles').select('maintenance_defaults').eq('id', user.id).single(),
    supabase
      .from('maintenance_entries')
      .select('*')
      .gte('date', loadedFrom)
      .lte('date', loadedTo)
      .order('date'),
  ])

  if (entriesError) {
    console.error('Error fetching maintenance entries:', entriesError)
  }

  const defaults = (profile?.maintenance_defaults || {}) as MaintenanceDefaults
  const hasDefaults = Object.values(defaults).some((slot) => slot && (slot.first_session || slot.second_session))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-2xl font-semibold text-foreground">Maintenance Training</h1>
          <MaintenanceWeekView
            initialWeekStart={weekStart}
            entries={entries || []}
            loadedFrom={loadedFrom}
            loadedTo={loadedTo}
            defaults={defaults}
            hasDefaults={hasDefaults}
          />
        </div>
      </main>
    </div>
  )
}
