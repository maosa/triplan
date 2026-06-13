import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/app/header'
import { MaintenanceWeekView } from '@/components/app/maintenance-week-view'
import { getWeekStart, parseDateString, toDateString } from '@/lib/date-utils'
import type { MaintenanceDefaults } from '@/types/database'

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

  // Load all of the user's maintenance entries once (a small dataset, scoped to
  // the user by RLS) so week navigation and edits are handled instantly client-side.
  const [{ data: profile }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from('profiles').select('maintenance_defaults').eq('id', user.id).single(),
    supabase.from('maintenance_entries').select('*').order('date'),
  ])

  if (entriesError) {
    console.error('Error fetching maintenance entries:', entriesError)
  }

  const defaults = (profile?.maintenance_defaults || {}) as MaintenanceDefaults
  const hasDefaults = Object.values(defaults).some((slot) => slot && (slot.am || slot.pm))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-2xl font-semibold text-foreground">Maintenance Training</h1>
          <MaintenanceWeekView
            initialWeekStart={weekStart}
            entries={entries || []}
            defaults={defaults}
            hasDefaults={hasDefaults}
          />
        </div>
      </main>
    </div>
  )
}
