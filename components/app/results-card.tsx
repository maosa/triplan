"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Pencil, Waves, Bike, Footprints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatSecondsToHMS, formatSecondsToPace } from "@/lib/time-format"
import { effectiveRaceType, sectionsForRaceType } from "@/lib/race-constants"
import type { Database } from "@/types/database"

type Race = Database['public']['Tables']['races']['Row']
type RaceResult = Database['public']['Tables']['race_results']['Row']

interface ResultsCardProps {
    race: Race
    result?: RaceResult | null
    units: string // 'metric' or 'imperial'
    onEdit: (race: Race) => void
}

// "–" placeholder for empty values.
const EMPTY = '–'

export function ResultsCard({ race, result, units, onEdit }: ResultsCardProps) {
    const [expanded, setExpanded] = useState(false)

    const isMetric = units !== 'imperial'
    const u = {
        swimDist: isMetric ? 'm' : 'y',
        dist: isMetric ? 'km' : 'mi',
        elev: isMetric ? 'm' : 'ft',
        speed: isMetric ? 'km/h' : 'mph',
        swimPace: isMetric ? '/100m' : '/100y',
        runPace: isMetric ? '/km' : '/mi',
    }

    const hasResults = !!result && hasAnyValue(result)

    // Single-sport races (swim/bike/run) collapse to a single Total time and a
    // trimmed breakdown; triathlon (and legacy null-type) keeps the full layout.
    const rt = effectiveRaceType(race.race_type)
    const isSingleSport = rt !== 'triathlon'
    const relevantSections = new Set(sectionsForRaceType(rt))

    const time = (s: number | null | undefined) => (s != null ? formatSecondsToHMS(s) : EMPTY)
    const pace = (s: number | null | undefined) => (s != null ? formatSecondsToPace(s) : EMPTY)

    const breakdown: { section: string; fields: { label: string; value: string }[] }[] = [
        {
            section: 'Swim',
            fields: [
                { label: `Distance (${u.swimDist})`, value: result?.swim_distance != null ? String(result.swim_distance) : EMPTY },
                { label: 'Time', value: time(result?.swim_time_seconds) },
                { label: `Pace (${u.swimPace})`, value: pace(result?.swim_pace_seconds) },
            ],
        },
        {
            section: 'T1',
            fields: [{ label: 'Time', value: time(result?.t1_time_seconds) }],
        },
        {
            section: 'Bike',
            fields: [
                { label: `Distance (${u.dist})`, value: result?.bike_distance != null ? String(result.bike_distance) : EMPTY },
                { label: `Elevation (${u.elev})`, value: result?.bike_elevation != null ? String(result.bike_elevation) : EMPTY },
                { label: 'Time', value: time(result?.bike_time_seconds) },
                { label: `Speed (${u.speed})`, value: result?.bike_speed != null ? String(result.bike_speed) : EMPTY },
            ],
        },
        {
            section: 'T2',
            fields: [{ label: 'Time', value: time(result?.t2_time_seconds) }],
        },
        {
            section: 'Run',
            fields: [
                { label: `Distance (${u.dist})`, value: result?.run_distance != null ? String(result.run_distance) : EMPTY },
                { label: `Elevation (${u.elev})`, value: result?.run_elevation != null ? String(result.run_elevation) : EMPTY },
                { label: 'Time', value: time(result?.run_time_seconds) },
                { label: `Pace (${u.runPace})`, value: pace(result?.run_pace_seconds) },
            ],
        },
        {
            section: 'Total',
            fields: [{ label: 'Time', value: time(result?.total_time_seconds) }],
        },
    ]

    // Keep only sections relevant to the race type (Total always shown). For
    // single-sport races, also drop the discipline's own "Time" row — the time
    // lives in Total, so showing it here would be redundant/empty.
    const visibleBreakdown = breakdown
        .filter((g) => g.section === 'Total' || relevantSections.has(g.section.toLowerCase()))
        .map((g) =>
            isSingleSport && g.section !== 'Total'
                ? { ...g, fields: g.fields.filter((f) => f.label !== 'Time') }
                : g
        )

    return (
        <div className="group rounded-lg border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground" title={race.name}>
                        {race.name}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {race.location ? `${race.location} · ` : ''}
                        {format(new Date(race.date), 'd MMM yyyy')}
                    </p>

                    {/* Collapsed summary: Swim/Bike/Run sub-times. Hidden for
                        single-sport races, where the sub-time equals the Total
                        shown on the right. */}
                    {hasResults && !expanded && !isSingleSport && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {result?.swim_time_seconds != null && (
                                <span className="flex items-center gap-1">
                                    <Waves className="h-3.5 w-3.5" />
                                    <span className="font-mono">{formatSecondsToHMS(result.swim_time_seconds)}</span>
                                </span>
                            )}
                            {result?.bike_time_seconds != null && (
                                <span className="flex items-center gap-1">
                                    <Bike className="h-3.5 w-3.5" />
                                    <span className="font-mono">{formatSecondsToHMS(result.bike_time_seconds)}</span>
                                </span>
                            )}
                            {result?.run_time_seconds != null && (
                                <span className="flex items-center gap-1">
                                    <Footprints className="h-3.5 w-3.5" />
                                    <span className="font-mono">{formatSecondsToHMS(result.run_time_seconds)}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                    {hasResults ? (
                        <div className="flex flex-col items-end">
                            {result?.total_time_seconds != null && (
                                <span className="font-mono text-lg font-semibold text-foreground">
                                    {formatSecondsToHMS(result.total_time_seconds)}
                                </span>
                            )}
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                                    onClick={() => onEdit(race)}
                                    title="Edit results"
                                >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit results</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setExpanded((v) => !v)}
                                    title={expanded ? 'Collapse' : 'Expand'}
                                >
                                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    <span className="sr-only">{expanded ? 'Collapse' : 'Expand'}</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            onClick={() => onEdit(race)}
                        >
                            Add results
                        </Button>
                    )}
                </div>
            </div>

            {/* Expanded breakdown */}
            {hasResults && expanded && (
                <div className="border-t border-border p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {visibleBreakdown.flatMap((group) =>
                            group.fields.map((f) => (
                                <div key={`${group.section}-${f.label}`}>
                                    <p className="text-xs text-muted-foreground">
                                        {group.section} · {f.label}
                                    </p>
                                    <p className="font-mono text-sm text-foreground">{f.value}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// True if the result row has at least one non-null measurement field.
function hasAnyValue(result: RaceResult): boolean {
    const keys: (keyof RaceResult)[] = [
        'swim_distance', 'swim_time_seconds', 'swim_pace_seconds',
        't1_time_seconds',
        'bike_distance', 'bike_elevation', 'bike_time_seconds', 'bike_speed',
        't2_time_seconds',
        'run_distance', 'run_elevation', 'run_time_seconds', 'run_pace_seconds',
        'total_time_seconds',
    ]
    return keys.some((k) => result[k] != null)
}
