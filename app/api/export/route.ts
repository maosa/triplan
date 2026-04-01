import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'

export async function GET(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch races and workouts efficiently using join
    const { data: races, error } = await supabase
        .from('races')
        .select('*, workouts(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

    if (error || !races) {
        return new NextResponse('Error fetching data', { status: 500 })
    }

    const rows: any[] = []

    for (const race of races) {
        const workouts = race.workouts || []
        // Sort workouts by date
        workouts.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (workouts.length === 0) {
            rows.push({
                "Race Name": race.name,
                "Race Location": race.location || '',
                "Race Date": race.date,
                "Race Details": race.details || '',
                // Workout fields blank
                "Workout Date": '',
                "Workout Type": '',
                "Workout Duration": '',
                "Workout Distance": '',
                "Workout Intensity": '',
                "Workout Details": '',
            })
        } else {
            for (const workout of workouts) {
                rows.push({
                    "Race Name": race.name,
                    "Race Location": race.location || '',
                    "Race Date": race.date,
                    "Race Details": race.details || '',
                    "Workout Date": workout.date,
                    "Workout Type": workout.type,
                    "Workout Duration": workout.duration || '',
                    "Workout Distance": workout.distance || '',
                    "Workout Intensity": workout.intensity !== null ? workout.intensity : '',
                    "Workout Details": workout.details || '',
                })
            }
        }
    }

    const csv = Papa.unparse(rows)

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="triplan-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
    })
}
