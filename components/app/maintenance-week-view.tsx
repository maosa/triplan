"use client"

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, addWeeks, subWeeks, isSameWeek, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, ClipboardPaste, Eraser, CalendarCheck, BedDouble } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { MaintenanceGrid } from './maintenance-grid'
import { MAINTENANCE_TYPE_STYLES, MAINTENANCE_TYPE_ORDER, type WorkoutCellType } from '@/lib/maintenance-colors'
import { getWeekDays, formatWeekRange, toDateString, parseDateString } from '@/lib/date-utils'
import { upsertMaintenanceEntry, pasteDefaultSchedule, clearMaintenanceWeek, fillRestWeek } from '@/app/actions'
import type { Database } from '@/types/database'

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
  const [restOpen, setRestOpen] = useState(false)
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
    sublabel: format(day, 'dd MMM'),
    isToday: isSameDay(day, today),
  }))

  const navigate = (newWeekStart: Date) => {
    router.push(`/maintenance?week=${toDateString(newWeekStart)}`)
  }

  // Swipe the grid left/right to change weeks (touch devices). Vertical gestures
  // fall through to normal scrolling; cell taps have ~0 movement and are unaffected.
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || isPending) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    const SWIPE_MIN = 50
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) navigate(addWeeks(weekStartDate, 1)) // swipe left → next week
    else navigate(subWeeks(weekStartDate, 1)) // swipe right → previous week
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

  const handleRestConfirm = () => {
    startTransition(async () => {
      const result = await fillRestWeek(weekStart)
      if (!result?.error) setRestOpen(false)
    })
  }

  // True when the displayed week has at least one populated cell (enables Clear).
  const weekHasEntries = Object.values(values).some((s) => s.am || s.pm)
  // True when at least one cell is empty (enables Fill-Rest).
  const weekHasEmptyCells = Object.values(values).some((s) => !s.am || !s.pm)

  // Weekly summary counts. Non-Rest sessions are counted per cell. Rest is only
  // counted as a full rest day — i.e. when BOTH sessions that day are Rest — so a
  // single Rest paired with a workout (or an empty slot) is not shown. This keeps
  // the summary meaningful instead of inflating it with incidental Rest cells.
  const weekCounts: Record<string, number> = {}
  for (const { am, pm } of Object.values(values)) {
    for (const session of [am, pm]) {
      if (session && session !== 'Rest') {
        weekCounts[session] = (weekCounts[session] || 0) + 1
      }
    }
    if (am === 'Rest' && pm === 'Rest') {
      weekCounts.Rest = (weekCounts.Rest || 0) + 1
    }
  }

  return (
    <div className="space-y-8">
      {/* Navigation + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(subWeeks(weekStartDate, 1))}
            disabled={isPending}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(today)}
            disabled={isPending || viewingCurrentWeek}
            className="h-9 px-3 py-0 shrink-0 max-[340px]:w-9 max-[340px]:px-0"
            aria-label="Go to current week"
          >
            <CalendarCheck className="h-4 w-4 hidden max-[340px]:inline" />
            <span className="max-[340px]:hidden">Today</span>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(addWeeks(weekStartDate, 1))}
            disabled={isPending}
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
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
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setRestOpen(true)}
            disabled={isPending || !weekHasEmptyCells}
            aria-label="Fill empty cells with Rest"
            title="Fill empty cells with Rest"
          >
            <BedDouble className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
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

      {/* Week label + grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatWeekRange(weekStartDate)}
          </span>
          {viewingCurrentWeek && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              This week
            </span>
          )}
        </div>

        <div
          className="rounded-lg border border-border bg-card p-4 sm:p-6 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <MaintenanceGrid columns={columns} values={values} onChange={handleCellChange} />
        </div>
      </div>

      {/* Summary stats */}
      <div className="space-y-3">
        <StatsRow label="This week" counts={weekCounts} />
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

      {/* Fill-with-Rest confirmation */}
      <Modal isOpen={restOpen} onClose={() => setRestOpen(false)} title="Fill empty cells with Rest?">
        <p className="text-sm text-muted-foreground">
          This will set every empty cell in{' '}
          <span className="font-medium text-foreground">{formatWeekRange(weekStartDate)}</span> to Rest. Existing
          sessions are left unchanged.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRestOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleRestConfirm} isLoading={isPending}>
            Fill with Rest
          </Button>
        </div>
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
