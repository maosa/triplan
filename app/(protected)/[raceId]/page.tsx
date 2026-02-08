import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkoutList } from '@/components/app/workout-list'
import { Header } from '@/components/app/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface PageProps {
    params: Promise<{ raceId: string }>;
}

export default async function RacePage({ params }: PageProps) {
    const { raceId } = await params

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Race + Profile (for units)
    // We can fetch profile separately or use a join if we had relationship, 
    // but profile is 1:1 with user, not race.

    const { data: profile } = await supabase
        .from('profiles')
        .select('units')
        .eq('id', user.id)
        .single()

    const userUnits = profile?.units || 'metric'

    const { data: race, error: raceError } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single()

    if (raceError || !race) {
        // If error is 406 (Not Acceptable) or empty result, it means RLS blocked it or it doesn't exist
        notFound()
    }

    const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('race_id', raceId)
        .order('date', { ascending: true })

    if (workoutError) {
        console.error(workoutError)
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header should NOT include Profile link according to requirements? 
          "The Profile / Account page is accessible only from the Race page 
           (e.g., via user avatar or “Account” button in the Race page header).
           Do not link to Profile from the Training Plan page."
           So we should make a custom header or just back button here.
      */}
            <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
                <div className="container flex h-16 items-center px-4 sm:px-8">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Races
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:px-8 space-y-8">

                {/* Race Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">{race.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-gray-400">
                        <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(new Date(race.date), "MMMM d, yyyy")}
                        </div>
                        {race.location && (
                            <div className="flex items-center mt-1 sm:mt-0">
                                <MapPin className="mr-2 h-4 w-4" />
                                {race.location}
                            </div>
                        )}
                    </div>
                </div>

                <WorkoutList
                    initialWorkouts={workouts || []}
                    raceId={raceId}
                    raceDate={race.date}
                    units={userUnits}
                />
            </main>
        </div>
    )
}
