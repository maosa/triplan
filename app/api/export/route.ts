import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { logSecurityEvent } from '@/lib/security-events'

// Prevent CSV formula injection: spreadsheet apps treat cells starting with
// =, +, -, @, \t, or \r as formulas. Prefix them with a single-quote so the
// content is treated as plain text.
function sanitizeCsvField(value: string): string {
    if (!value) return value
    if (/^[=+\-@\t\r]/.test(value)) {
        return `'${value}`
    }
    return value
}

export async function GET() {
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

    const rows: Record<string, string | number>[] = []

    for (const race of races) {
        const workouts = race.workouts || []
        workouts.sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (workouts.length === 0) {
            rows.push({
                "Race Name": sanitizeCsvField(race.name),
                "Race Location": sanitizeCsvField(race.location || ''),
                "Race Date": race.date,
                "Race Details": sanitizeCsvField(race.details || ''),
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
                    "Race Name": sanitizeCsvField(race.name),
                    "Race Location": sanitizeCsvField(race.location || ''),
                    "Race Date": race.date,
                    "Race Details": sanitizeCsvField(race.details || ''),
                    "Workout Date": workout.date,
                    "Workout Type": workout.type,
                    "Workout Duration": workout.duration || '',
                    "Workout Distance": workout.distance || '',
                    "Workout Intensity": workout.intensity !== null ? workout.intensity : '',
                    "Workout Details": sanitizeCsvField(workout.details || ''),
                })
            }
        }
    }

    const csv = Papa.unparse(rows)

    await logSecurityEvent({
        userId: user.id,
        eventType: 'csv_export',
        metadata: { race_count: races.length },
    })

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="triplan-export-${new Date().toISOString().split('T')[0]}.csv"`,
            // Prevent the exported file from being cached — it contains personal data
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
        },
    })
}
