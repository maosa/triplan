"use client"

import {
    BarChart,
    Bar,
    XAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { getWorkoutIcon } from '@/components/app/workout-icons'
import {
    buildWeeklyData,
    buildGlobalWeekRange,
    formatMinutesToHHMM,
    type WorkoutType,
    type WeeklyDataPoint,
} from '@/lib/chart-utils'
import type { Database } from '@/types/database'

type Workout = Database['public']['Tables']['workouts']['Row']

interface TrainingChartsProps {
    workouts: Workout[]
    units: string
    raceDate: string
}

const CHART_TYPES: WorkoutType[] = ['Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other']

const TYPE_COLORS: Record<WorkoutType, string> = {
    Swim:     '#60a5fa',
    Bike:     '#4ade80',
    Run:      '#fb923c',
    Strength: '#f87171',
    Rest:     '#9ca3af',
    Other:    '#c084fc',
}

const TYPE_TEXT_COLORS: Record<WorkoutType, string> = {
    Swim:     'text-blue-400',
    Bike:     'text-green-400',
    Run:      'text-orange-400',
    Strength: 'text-red-400',
    Rest:     'text-gray-400',
    Other:    'text-purple-400',
}

// ── Tooltip renderer factory ──────────────────────────────────────────────────
// Returns a render function so we avoid spreading Recharts' complex prop types.

type ChartField = 'duration' | 'distance' | 'count'

function makeTooltipContent(field: ChartField, units: string) {
    return function TooltipContent({
        active,
        payload,
        label,
    }: {
        active?: boolean
        payload?: ReadonlyArray<{ value?: number | string }>
        label?: string
    }) {
        if (!active || !payload?.length) return null
        const raw = payload[0].value
        const value = typeof raw === 'number' ? raw : 0

        const formatted =
            field === 'duration'
                ? (() => {
                    const h = Math.floor(value / 60)
                    const m = value % 60
                    return h > 0 ? `${h}h ${m}m` : `${m}m`
                })()
                : field === 'count'
                ? `${value} session${value === 1 ? '' : 's'}`
                : `${value.toFixed(1)} ${units === 'imperial' ? 'mi' : 'km'}`

        return (
            <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-muted-foreground mt-0.5">{formatted}</p>
            </div>
        )
    }
}

// ── Single chart cell ─────────────────────────────────────────────────────────

interface ChartCellProps {
    data: WeeklyDataPoint[]
    type: WorkoutType
    field: ChartField
    units: string
}

function ChartCell({ data, type, field, units }: ChartCellProps) {
    if (data.length === 0) {
        // No data — leave cell completely blank
        return <div />
    }

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const totalLabel =
        field === 'duration'
            ? formatMinutesToHHMM(total)
            : field === 'count'
            ? `${total} session${total === 1 ? '' : 's'}`
            : `${total.toFixed(1)} ${units === 'imperial' ? 'mi' : 'km'}`

    const TooltipContent = makeTooltipContent(field, units)

    return (
        <div className="pt-6 relative">
            {/* Total — top-right */}
            <p className="absolute right-0 top-0 text-xs text-muted-foreground tabular-nums">
                {totalLabel}
            </p>

            <ResponsiveContainer width="100%" height={130}>
                <BarChart
                    data={data}
                    margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
                    barCategoryGap="30%"
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                    />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                        content={<TooltipContent />}
                    />
                    <Bar
                        dataKey="value"
                        fill={TYPE_COLORS[type]}
                        radius={[3, 3, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrainingCharts({ workouts, units, raceDate }: TrainingChartsProps) {
    // Compute a single week range spanning all workouts (any type).
    // Passing this as forcedRange to every buildWeeklyData call ensures all
    // charts share the same x-axis, making week-over-week comparison easy.
    const globalRange = buildGlobalWeekRange(workouts, raceDate) ?? undefined

    return (
        <div className="overflow-x-auto">
            {/* min-width ensures the grid never collapses on small screens */}
            <div className="min-w-[640px]">
                {/* Grid: [type label] [duration chart] [distance chart] */}
                <div className="grid gap-x-6 gap-y-8" style={{ gridTemplateColumns: '160px 1fr 1fr' }}>

                    {/* ── Header row ── */}
                    <div /> {/* empty type column */}
                    <p className="text-sm font-semibold text-foreground">Workout Duration</p>
                    <p className="text-sm font-semibold text-foreground">Workout Distance</p>

                    {/* ── One row per workout type ── */}
                    {CHART_TYPES.map((type) => {
                        // Rest: duration column shows count of rest days per week
                        const durationData =
                            type === 'Rest'
                                ? buildWeeklyData(workouts, 'Rest', 'count', raceDate, globalRange)
                                : buildWeeklyData(workouts, type, 'duration', raceDate, globalRange)

                        const distanceData = buildWeeklyData(workouts, type, 'distance', raceDate, globalRange)

                        const durationField: ChartField = type === 'Rest' ? 'count' : 'duration'

                        return (
                            <>
                                {/* Type label */}
                                <div key={`${type}-label`} className="flex items-center gap-2 pt-6">
                                    {getWorkoutIcon(type)}
                                    <span className={`text-sm font-medium ${TYPE_TEXT_COLORS[type]}`}>
                                        {type}
                                    </span>
                                </div>

                                {/* Duration chart (or rest-day count for Rest) */}
                                <ChartCell
                                    key={`${type}-duration`}
                                    data={durationData}
                                    type={type}
                                    field={durationField}
                                    units={units}
                                />

                                {/* Distance chart */}
                                <ChartCell
                                    key={`${type}-distance`}
                                    data={distanceData}
                                    type={type}
                                    field="distance"
                                    units={units}
                                />
                            </>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
