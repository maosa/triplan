import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { Header } from '@/components/app/header'
import { ResultsList } from '@/components/app/results-list'
import type { Database } from '@/types/database'

type RaceResult = Database['public']['Tables']['race_results']['Row']

export default async function ResultsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Today at local midnight — a race is "completed" once its date has passed.
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: profile }, { data: races, error }] = await Promise.all([
    supabase.from('profiles').select('units').eq('id', user.id).maybeSingle(),
    supabase.from('races').select('*').lt('date', today).order('date', { ascending: false }),
  ])

  if (error) {
    console.error('Error fetching races:', error)
    Sentry.captureException(error, { tags: { context: 'results_page.fetch_races' } })
  }

  const units = profile?.units || 'metric'
  const completedRaces = races || []

  // Fetch results for the completed races in a single query, keyed by race_id.
  const results: Record<string, RaceResult> = {}
  if (completedRaces.length > 0) {
    const { data: rows } = await supabase
      .from('race_results')
      .select('*')
      .in('race_id', completedRaces.map((r) => r.id))
    for (const row of rows || []) {
      results[row.race_id] = row
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-8 space-y-12">
        <ResultsList races={completedRaces} results={results} units={units} />
      </main>
    </div>
  )
}
