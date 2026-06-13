import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/app/header'
import { MaintenanceWeekView } from '@/components/app/maintenance-week-view'
import { getWeekStart, parseDateString, toDateString } from '@/lib/date-utils'
import { addDays } from 'date-fns'

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

  // Displayed week's Mon–Sun range — supplies the grid and the "This week" stats.
  const weekEnd = toDateString(addDays(weekStartDate, 6))

  const [{ data: profile }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from('profiles').select('maintenance_defaults').eq('id', user.id).single(),
    supabase
      .from('maintenance_entries')
      .select('*')
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ])

  if (entriesError) {
    console.error('Error fetching maintenance entries:', entriesError)
  }

  const defaults = (profile?.maintenance_defaults || {}) as Record<string, { am: string | null; pm: string | null }>
  const hasDefaults = Object.values(defaults).some((slot) => slot && (slot.am || slot.pm))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-2xl font-semibold text-foreground">Maintenance Training</h1>
          <MaintenanceWeekView weekStart={weekStart} entries={entries || []} hasDefaults={hasDefaults} />
        </div>
      </main>
    </div>
  )
}
