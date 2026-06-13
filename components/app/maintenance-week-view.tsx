"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, addWeeks, subWeeks, isSameWeek, isSameMonth, isSameYear, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, ClipboardPaste, Eraser, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { MaintenanceGrid } from './maintenance-grid'
import { MAINTENANCE_TYPE_STYLES, MAINTENANCE_TYPE_ORDER, type WorkoutCellType } from '@/lib/maintenance-colors'
import { getWeekDays, formatWeekRange, toDateString, parseDateString } from '@/lib/date-utils'
import { upsertMaintenanceEntry, pasteDefaultSchedule, clearMaintenanceWeek } from '@/app/actions'
import type { Database } from '@/types/database'
import { cn } from '@/lib/utils'

type MaintenanceEntry = Database['public']['Tables']['maintenance_entries']['Row']

interface MaintenanceWeekViewProps {
  weekStart: string // YYYY-MM-DD (Monday)
  entries: MaintenanceEntry[] // entries for the whole year containing weekStart
  hasDefaults: boolean
}

const SESSION_LABELS = ['AM', 'PM'] as const

export function MaintenanceWeekView({ weekStart, entries, hasDefaults }: MaintenanceWeekViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pasteOpen, setPasteOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const weekStartDate = parseDateString(weekStart) ?? new Date()
  const weekDays = getWeekDays(weekStartDate)
  const today = new Date()
  const viewingCurrentWeek = isSameWeek(weekStartDate, today, { weekStartsOn: 1 })

  // Build the grid values keyed by date string.
  const values: Record<string, { am: WorkoutCellType | null; pm: WorkoutCellType | null }> = {}
  for (const day of weekDays) {
    values[toDateString(day)] = { am: null, pm: null }
  }
  for (const entry of entries) {
    const slot = values[entry.date]
    if (slot) {
      if (entry.session === 'AM') slot.am = entry.type
      else slot.pm = entry.type
    }
  }

  const columns = weekDays.map((day) => ({
    key: toDateString(day),
    label: format(day, 'EEE'),
    sublabel: format(day, 'd MMM'),
    isToday: isSameDay(day, today),
  }))

  const navigate = (newWeekStart: Date) => {
    router.push(`/maintenance?week=${toDateString(newWeekStart)}`)
  }

  const handleCellChange = (columnKey: string, session: 'am' | 'pm', value: WorkoutCellType | null) => {
    startTransition(async () => {
      await upsertMaintenanceEntry(columnKey, session === 'am' ? 'AM' : 'PM', value)
    })
  }

  const handlePasteConfirm = () => {
    startTransition(async () => {
      const result = await pasteDefaultSchedule(weekStart)
      if (!result?.error) setPasteOpen(false)
    })
  }

  const handleClearConfirm = () => {
    startTransition(async () => {
      const result = await clearMaintenanceWeek(weekStart)
      if (!result?.error) setClearOpen(false)
    })
  }

  // True when the displayed week has at least one populated cell (enables Clear).
  const weekHasEntries = Object.values(values).some((s) => s.am || s.pm)

  // Count entries within the displayed week / month / year, bucketed by type.
  const countFor = (predicate: (d: Date) => boolean): Record<string, number> => {
    const counts: Record<string, number> = {}
    for (const entry of entries) {
      const d = parseDateString(entry.date)
      if (d && predicate(d)) {
        counts[entry.type] = (counts[entry.type] || 0) + 1
      }
    }
    return counts
  }

  const weekCounts = countFor((d) => isSameWeek(d, weekStartDate, { weekStartsOn: 1 }))
  const monthCounts = countFor((d) => isSameMonth(d, weekStartDate))
  const yearCounts = countFor((d) => isSameYear(d, weekStartDate))

  return (
    <div className="space-y-8">
      {/* Navigation + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(subWeeks(weekStartDate, 1))}
            disabled={isPending}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span
            className={cn(
              'h-9 inline-flex items-center justify-center rounded-full px-3 text-sm font-medium text-center transition-colors whitespace-nowrap min-w-[7rem]',
              viewingCurrentWeek ? 'bg-primary/10 text-primary' : 'text-foreground'
            )}
          >
            {formatWeekRange(weekStartDate)}
          </span>
          <Button
            variant="secondary"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(addWeeks(weekStartDate, 1))}
            disabled={isPending}
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(today)}
            disabled={isPending || viewingCurrentWeek}
            className="h-9 w-9 p-0 sm:w-auto sm:px-3 shrink-0 ml-1"
            aria-label="Go to current week"
          >
            <CalendarCheck className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Today</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            className="h-9 w-9 shrink-0"
            onClick={() => setPasteOpen(true)}
            disabled={isPending}
            aria-label="Paste default schedule"
            title="Paste default schedule"
          >
            <ClipboardPaste className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            className="h-9 w-9 shrink-0"
            onClick={() => setClearOpen(true)}
            disabled={isPending || !weekHasEntries}
            aria-label="Clear this week"
            title="Clear this week"
          >
            <Eraser className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <MaintenanceGrid columns={columns} values={values} onChange={handleCellChange} />
      </div>

      {/* Summary stats */}
      <div className="space-y-3">
        <StatsRow label="This week" counts={weekCounts} />
        <StatsRow label="This month" counts={monthCounts} />
        <StatsRow label="This year" counts={yearCounts} />
      </div>

      {/* Paste confirmation */}
      <Modal isOpen={pasteOpen} onClose={() => setPasteOpen(false)} title="Paste default schedule?">
        {hasDefaults ? (
          <>
            <p className="text-sm text-muted-foreground">
              This will apply your saved weekly schedule to{' '}
              <span className="font-medium text-foreground">{formatWeekRange(weekStartDate)}</span>, overwriting any
              existing entries for this week. Continue?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setPasteOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handlePasteConfirm} isLoading={isPending}>
                Paste Schedule
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t set up a default schedule yet — set one up in Account Settings first.
            </p>
            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={() => setPasteOpen(false)}>
                Close
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Clear confirmation */}
      <Modal isOpen={clearOpen} onClose={() => setClearOpen(false)} title="Clear this week?">
        <p className="text-sm text-muted-foreground">
          This will remove all entries for{' '}
          <span className="font-medium text-foreground">{formatWeekRange(weekStartDate)}</span>. This can&apos;t be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setClearOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClearConfirm} isLoading={isPending}>
            Clear Week
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function StatsRow({ label, counts }: { label: string; counts: Record<string, number> }) {
  const active = MAINTENANCE_TYPE_ORDER.filter((type) => counts[type])

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">{label}</span>
      {active.length > 0 ? (
        <div className="flex items-center gap-3 flex-wrap">
          {active.map((type) => {
            const Icon = MAINTENANCE_TYPE_STYLES[type].icon
            return (
              <div key={type} className="flex items-center gap-0.5 text-xs text-muted-foreground" title={type}>
                <Icon className="h-3.5 w-3.5" />
                <span>{counts[type]}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/60">—</span>
      )}
    </div>
  )
}
