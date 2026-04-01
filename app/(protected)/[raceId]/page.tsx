import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkoutList } from '@/components/app/workout-list'
import { MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Header } from '@/components/app/header'

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

    // Fetch profile, race, and workouts in parallel
    const [{ data: profile }, { data: race, error: raceError }, { data: workouts, error: workoutError }] = await Promise.all([
        supabase
            .from('profiles')
            .select('units')
            .eq('id', user.id)
            .single(),
        supabase
            .from('races')
            .select('*')
            .eq('id', raceId)
            .single(),
        supabase
            .from('workouts')
            .select('*')
            .eq('race_id', raceId)
            .order('date', { ascending: false })
            .order('updated_at', { ascending: false })
            .order('created_at', { ascending: false })
            .order('id', { ascending: false }),
    ])

    const userUnits = profile?.units || 'metric'

    if (raceError || !race) {
        notFound()
    }

    if (workoutError) {
        console.error(workoutError)
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header backLink="/" />

            <main className="container mx-auto px-4 py-8 sm:px-8 space-y-8">

                {/* Race Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{race.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-muted-foreground">
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
                    {race.details && (
                        <p className="text-sm text-muted-foreground mt-2">{race.details}</p>
                    )}
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
