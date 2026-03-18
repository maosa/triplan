import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/app/header'
import { TrainingCharts } from '@/components/app/training-charts'
import { MapPin, Calendar, Waves, Bike, Footprints, Dumbbell, BedDouble, Activity } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '@/types/database'

type Workout = Database['public']['Tables']['workouts']['Row']

interface PageProps {
    params: Promise<{ raceId: string }>
}

const WORKOUT_TYPE_ORDER = ['Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other'] as const

const WORKOUT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Swim: Waves,
    Bike: Bike,
    Run: Footprints,
    Strength: Dumbbell,
    Rest: BedDouble,
    Other: Activity,
}

const WORKOUT_TYPE_ICON_COLORS: Record<string, string> = {
    Swim: 'text-blue-400',
    Bike: 'text-green-400',
    Run: 'text-orange-400',
    Strength: 'text-red-400',
    Rest: 'text-gray-400',
    Other: 'text-purple-400',
}

export default async function DashboardPage({ params }: PageProps) {
    const { raceId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile, race, and workouts in parallel
    const [{ data: profile }, { data: race, error: raceError }, { data: workouts }] = await Promise.all([
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
            .eq('race_id', raceId),
    ])

    if (raceError || !race) {
        notFound()
    }

    const userUnits = profile?.units || 'metric'
    const safeWorkouts = workouts ?? []

    // Build workout type counts for the badge row
    const workoutCounts: Record<string, number> = {}
    for (const w of safeWorkouts) {
        workoutCounts[w.type] = (workoutCounts[w.type] ?? 0) + 1
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header backLink={`/${raceId}`} backLinkLabel="Back to Plan" />

            <main className="container mx-auto px-4 py-8 sm:px-8 space-y-8">

                {/* Race details */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{race.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-muted-foreground">
                        <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(new Date(race.date), 'MMMM d, yyyy')}
                        </div>
                        {race.location && (
                            <div className="flex items-center mt-1 sm:mt-0">
                                <MapPin className="mr-2 h-4 w-4" />
                                {race.location}
                            </div>
                        )}
                    </div>

                    {/* Workout type count badges */}
                    {Object.keys(workoutCounts).length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap pt-1">
                            {WORKOUT_TYPE_ORDER.filter(type => workoutCounts[type]).map(type => {
                                const Icon = WORKOUT_TYPE_ICONS[type]
                                return (
                                    <div
                                        key={type}
                                        className={`flex items-center gap-1 text-sm ${WORKOUT_TYPE_ICON_COLORS[type]}`}
                                        title={type}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-muted-foreground">{workoutCounts[type]}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Charts */}
                {safeWorkouts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center">
                        <p className="text-muted-foreground">No workouts tracked yet. Add workouts to see your training dashboard.</p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-border bg-card p-6">
                        <TrainingCharts
                            workouts={safeWorkouts}
                            units={userUnits}
                            raceDate={race.date}
                        />
                    </div>
                )}
            </main>
        </div>
    )
}
