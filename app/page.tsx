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

  const { data: races, error } = await supabase
    .from('races')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching races:', error)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-8 space-y-12">
        <RaceList initialRaces={races || []} />
      </main>
    </div>
  )
}
