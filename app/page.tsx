import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RaceList } from '@/components/app/race-list'
import { Header } from '@/components/app/header'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: races, error }, { data: workouts, error: workoutsError }] = await Promise.all([
    supabase.from('races').select('*').order('date', { ascending: false }),
    supabase.from('workouts').select('race_id, type'),
  ])

  if (error) {
    console.error('Error fetching races:', error)
  }
  if (workoutsError) {
    console.error('Error fetching workouts:', workoutsError)
  }

  // Build workout counts per race: { raceId: { Swim: 3, Run: 5, ... } }
  const workoutCounts: Record<string, Record<string, number>> = {}
  if (workouts) {
    for (const w of workouts) {
      if (!workoutCounts[w.race_id]) {
        workoutCounts[w.race_id] = {}
      }
      workoutCounts[w.race_id][w.type] = (workoutCounts[w.race_id][w.type] || 0) + 1
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-8 space-y-12">
        <RaceList initialRaces={races || []} workoutCounts={workoutCounts} />
      </main>
    </div>
  )
}
