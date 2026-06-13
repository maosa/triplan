"use client"

import { useState, useTransition, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { upsertRaceResult } from "@/app/actions"
import type { Database } from "@/types/database"
import {
    formatSecondsToHMS,
    formatSecondsToPace,
    isValidTimeString,
    isValidPaceString,
    maskTimeInput,
    maskPaceInput,
    parseTimeToSeconds,
    parsePaceToSeconds,
} from "@/lib/time-format"

type RaceResult = Database['public']['Tables']['race_results']['Row']

interface RaceResultsModalProps {
    isOpen: boolean
    onClose: () => void
    raceId: string
    raceName: string
    existingResult?: RaceResult | null
    units: string // 'metric' or 'imperial'
}

// Field kinds drive both rendering and validation.
type FieldKind = 'number' | 'time' | 'pace'

interface FieldDef {
    name: string // form field name (matches server action keys)
    label: string
    kind: FieldKind
    unit?: string // unit suffix shown in the label
}

export function RaceResultsModal({
    isOpen,
    onClose,
    raceId,
    raceName,
    existingResult,
    units,
}: RaceResultsModalProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const isMetric = units !== 'imperial'

    // Unit labels per profile units.
    const u = {
        swimDist: isMetric ? 'm' : 'y',
        dist: isMetric ? 'km' : 'mi',
        elev: isMetric ? 'm' : 'ft',
        speed: isMetric ? 'km/h' : 'mph',
        swimPace: isMetric ? '/100m' : '/100y',
        runPace: isMetric ? '/km' : '/mi',
    }

    const sections: { title: string; fields: FieldDef[] }[] = [
        {
            title: 'Swim',
            fields: [
                { name: 'swim_distance', label: `Distance (${u.swimDist})`, kind: 'number' },
                { name: 'swim_time', label: 'Time (HH:MM:SS)', kind: 'time' },
                { name: 'swim_pace', label: `Pace (MM:SS${u.swimPace})`, kind: 'pace' },
            ],
        },
        {
            title: 'Transition 1',
            fields: [
                { name: 't1_time', label: 'T1 Time (HH:MM:SS)', kind: 'time' },
            ],
        },
        {
            title: 'Bike',
            fields: [
                { name: 'bike_distance', label: `Distance (${u.dist})`, kind: 'number' },
                { name: 'bike_elevation', label: `Elevation Gain (${u.elev})`, kind: 'number' },
                { name: 'bike_time', label: 'Time (HH:MM:SS)', kind: 'time' },
                { name: 'bike_speed', label: `Speed (${u.speed})`, kind: 'number' },
            ],
        },
        {
            title: 'Transition 2',
            fields: [
                { name: 't2_time', label: 'T2 Time (HH:MM:SS)', kind: 'time' },
            ],
        },
        {
            title: 'Run',
            fields: [
                { name: 'run_distance', label: `Distance (${u.dist})`, kind: 'number' },
                { name: 'run_time', label: 'Time (HH:MM:SS)', kind: 'time' },
                { name: 'run_pace', label: `Pace (MM:SS${u.runPace})`, kind: 'pace' },
            ],
        },
        {
            title: 'Total',
            fields: [
                { name: 'total_time', label: 'Total Time (HH:MM:SS)', kind: 'time' },
            ],
        },
    ]

    // Initial display values derived from the existing result row.
    const initialValues = (): Record<string, string> => ({
        swim_distance: existingResult?.swim_distance?.toString() ?? '',
        swim_time: formatSecondsToHMS(existingResult?.swim_time_seconds ?? null),
        swim_pace: formatSecondsToPace(existingResult?.swim_pace_seconds ?? null),
        t1_time: formatSecondsToHMS(existingResult?.t1_time_seconds ?? null),
        bike_distance: existingResult?.bike_distance?.toString() ?? '',
        bike_elevation: existingResult?.bike_elevation?.toString() ?? '',
        bike_time: formatSecondsToHMS(existingResult?.bike_time_seconds ?? null),
        bike_speed: existingResult?.bike_speed?.toString() ?? '',
        t2_time: formatSecondsToHMS(existingResult?.t2_time_seconds ?? null),
        run_distance: existingResult?.run_distance?.toString() ?? '',
        run_time: formatSecondsToHMS(existingResult?.run_time_seconds ?? null),
        run_pace: formatSecondsToPace(existingResult?.run_pace_seconds ?? null),
        total_time: formatSecondsToHMS(existingResult?.total_time_seconds ?? null),
    })

    const [values, setValues] = useState<Record<string, string>>(initialValues)

    useEffect(() => {
        setValues(initialValues())
        setError(null)
        setFieldErrors({})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingResult, isOpen])

    const handleClose = () => {
        setError(null)
        setFieldErrors({})
        onClose()
    }

    const validateField = (field: FieldDef, value: string): string | null => {
        const v = value.trim()
        if (!v) return null // all fields optional
        if (field.kind === 'time' && !isValidTimeString(v)) {
            return 'Use HH:MM:SS or M:SS'
        }
        if (field.kind === 'pace' && !isValidPaceString(v)) {
            return 'Use MM:SS'
        }
        return null
    }

    const handleBlur = (field: FieldDef) => {
        const v = (values[field.name] || '').trim()
        const err = validateField(field, v)
        setFieldErrors((prev) => {
            const next = { ...prev }
            if (err) next[field.name] = err
            else delete next[field.name]
            return next
        })
        // Normalize valid time/pace to canonical zero-padded form (e.g. "29:30" -> "00:29:30").
        if (!err && v) {
            if (field.kind === 'time') {
                handleChange(field.name, formatSecondsToHMS(parseTimeToSeconds(v)))
            } else if (field.kind === 'pace') {
                handleChange(field.name, formatSecondsToPace(parsePaceToSeconds(v)))
            }
        }
    }

    const handleChange = (name: string, value: string) => {
        setValues((prev) => ({ ...prev, [name]: value }))
        setFieldErrors((prev) => {
            if (!prev[name]) return prev
            const next = { ...prev }
            delete next[name]
            return next
        })
    }

    const handleClearAll = () => {
        const cleared: Record<string, string> = {}
        for (const section of sections) {
            for (const field of section.fields) cleared[field.name] = ''
        }
        setValues(cleared)
        setFieldErrors({})
    }

    async function handleSubmit() {
        setError(null)

        // Validate all fields before submitting.
        const errs: Record<string, string> = {}
        for (const section of sections) {
            for (const field of section.fields) {
                const err = validateField(field, values[field.name] || '')
                if (err) errs[field.name] = err
            }
        }
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        const formData = new FormData()
        for (const [key, value] of Object.entries(values)) {
            formData.set(key, value.trim())
        }

        startTransition(async () => {
            const result = await upsertRaceResult(raceId, formData)
            if (result?.error) {
                setError(result.error)
            } else {
                handleClose()
            }
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Race Results — ${raceName}`} size="lg">
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                <div className="space-y-5">
                    {sections.map((section) => (
                        <div key={section.title} className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                                {section.title}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {section.fields.map((field) => (
                                    <div key={field.name} className="space-y-2">
                                        <Label htmlFor={field.name}>{field.label}</Label>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type={field.kind === 'number' ? 'number' : 'text'}
                                            inputMode={field.kind === 'number' ? 'decimal' : 'numeric'}
                                            step={field.kind === 'number' ? '0.01' : undefined}
                                            placeholder={
                                                field.kind === 'time'
                                                    ? 'HH:MM:SS'
                                                    : field.kind === 'pace'
                                                        ? 'MM:SS'
                                                        : '0'
                                            }
                                            value={values[field.name] ?? ''}
                                            onChange={(e) => {
                                                const raw = e.target.value
                                                const v = field.kind === 'time'
                                                    ? maskTimeInput(raw)
                                                    : field.kind === 'pace'
                                                        ? maskPaceInput(raw)
                                                        : raw
                                                handleChange(field.name, v)
                                            }}
                                            onBlur={field.kind === 'number' ? undefined : () => handleBlur(field)}
                                        />
                                        {fieldErrors[field.name] && (
                                            <p className="text-destructive text-xs">{fieldErrors[field.name]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {error && <p className="text-destructive text-sm">{error}</p>}

                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="ghost" size="sm" onClick={handleClearAll} disabled={isPending}>
                            Clear all
                        </Button>
                        <div className="flex space-x-2">
                            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSubmit} isLoading={isPending}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
