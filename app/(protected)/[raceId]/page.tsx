import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkoutList } from '@/components/app/workout-list'
import { MapPin, Calendar } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
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

    // Fetch profile, race, workouts, and race results in parallel
    const [{ data: profile }, { data: race, error: raceError }, { data: workouts, error: workoutError }, { data: raceResult }] = await Promise.all([
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
        // Order by date, then recency fields as stable tiebreakers for same-day
        // workouts. PostgREST applies each .order() cumulatively (ORDER BY date,
        // updated_at, created_at, id — all descending).
        supabase
            .from('workouts')
            .select('*')
            .eq('race_id', raceId)
            .order('date', { ascending: false })
            .order('updated_at', { ascending: false })
            .order('created_at', { ascending: false })
            .order('id', { ascending: false }),
        supabase
            .from('race_results')
            .select('*')
            .eq('race_id', raceId)
            .maybeSingle(),
    ])

    const userUnits = profile?.units || 'metric'

    if (raceError || !race) {
        notFound()
    }

    if (workoutError) {
        console.error(workoutError)
    }

    // A race is completed once its date is in the past (calendar-day comparison).
    const isCompleted = differenceInCalendarDays(new Date(race.date), new Date()) < 0

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="container mx-auto px-4 py-8 sm:px-8 space-y-8">

                {/* Race Header */}
                <div className="space-y-2">
                    <h1 className="flex h-10 items-center text-lg font-semibold text-foreground">{race.name}</h1>
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
                    raceName={race.name}
                    raceDate={race.date}
                    units={userUnits}
                    isCompleted={isCompleted}
                    raceResult={raceResult || null}
                />
            </main>
        </div>
    )
}
