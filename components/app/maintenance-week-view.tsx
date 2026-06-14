"use client"

import { useEffect, useRef, useState, useTransition } from 'react'
import { format, addWeeks, subWeeks, isSameWeek, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, ClipboardPaste, Eraser, CalendarCheck, BedDouble, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { MaintenanceGrid } from './maintenance-grid'
import { MAINTENANCE_TYPE_STYLES, MAINTENANCE_TYPE_ORDER, type WorkoutCellType } from '@/lib/maintenance-colors'
import { getWeekStart, getWeekDays, formatWeekRange, toDateString, parseDateString } from '@/lib/date-utils'
import { upsertMaintenanceEntry, pasteDefaultSchedule, clearMaintenanceWeek, fillRestWeek } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import type { Database, MaintenanceDefaults, MaintenanceSession } from '@/types/database'

type MaintenanceEntry = Database['public']['Tables']['maintenance_entries']['Row']

const SESSIONS: MaintenanceSession[] = ['first_session', 'second_session']

interface MaintenanceWeekViewProps {
  initialWeekStart: string // YYYY-MM-DD (Monday)
  entries: MaintenanceEntry[] // entries within the loaded date window (not "all")
  loadedFrom: string // YYYY-MM-DD — inclusive lower bound of the loaded window
  loadedTo: string // YYYY-MM-DD — inclusive upper bound of the loaded window
  defaults: MaintenanceDefaults
  hasDefaults: boolean
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

// Keep these aligned with the server's initial window in maintenance/page.tsx.
const WINDOW_WEEKS = 52 // size of each lazily-fetched extension chunk
const BUFFER_WEEKS = 4 // extend when the displayed week comes within this of an edge

// Master store key for a single session slot.
const slotKey = (date: string, session: MaintenanceSession) => `${date}|${session}`

export function MaintenanceWeekView({
  initialWeekStart,
  entries,
  loadedFrom,
  loadedTo,
  defaults,
  hasDefaults,
}: MaintenanceWeekViewProps) {
  const [, startSave] = useTransition()
  const [pasteOpen, setPasteOpen] = useState(false)
  const [restOpen, setRestOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  // Surfaced when a background save fails (after the optimistic change is rolled back).
  const [saveError, setSaveError] = useState<string | null>(null)

  // Client-owned state. The store holds every loaded session keyed by `${date}|AM|PM`
  // so navigation and edits are instant; the DB is updated in the background.
  const [store, setStore] = useState<Record<string, WorkoutCellType>>(() => {
    const initial: Record<string, WorkoutCellType> = {}
    for (const entry of entries) initial[slotKey(entry.date, entry.session)] = entry.type
    return initial
  })
  const [weekStart, setWeekStart] = useState(initialWeekStart)

  // The date range currently held in the store, and a guard against overlapping
  // background extensions.
  const [loadedRange, setLoadedRange] = useState({ from: loadedFrom, to: loadedTo })
  const [supabase] = useState(() => createClient())
  const extendingRef = useRef(false)

  const weekStartDate = parseDateString(weekStart) ?? new Date()
  const weekDays = getWeekDays(weekStartDate)
  const today = new Date()
  const viewingCurrentWeek = isSameWeek(weekStartDate, today, { weekStartsOn: 1 })

  // Derive the displayed week's grid values from the store.
  const values: Record<string, { first_session: WorkoutCellType | null; second_session: WorkoutCellType | null }> = {}
  for (const day of weekDays) {
    const ds = toDateString(day)
    values[ds] = {
      first_session: store[slotKey(ds, 'first_session')] ?? null,
      second_session: store[slotKey(ds, 'second_session')] ?? null,
    }
  }

  const columns = weekDays.map((day) => ({
    key: toDateString(day),
    label: format(day, 'EEE'),
    sublabel: format(day, 'dd MMM'),
    isToday: isSameDay(day, today),
  }))

  // Client-side week navigation — instant, no server round-trip. The URL is kept
  // in sync (for refresh/bookmark) via the History API without re-fetching.
  const goToWeek = (date: Date) => {
    const ws = toDateString(getWeekStart(date))
    setWeekStart(ws)
    window.history.replaceState(null, '', `/maintenance?week=${ws}`)
  }

  // Lazily extend the loaded window in the background when the displayed week nears
  // an edge, so sequential navigation never runs out of loaded data. Each fetch is a
  // bounded date range — cap-proof and constant-cost regardless of total history.
  useEffect(() => {
    if (extendingRef.current) return
    const wsd = parseDateString(weekStart)
    const fromDate = parseDateString(loadedRange.from)
    const toDate = parseDateString(loadedRange.to)
    if (!wsd || !fromDate || !toDate) return

    const nearStart = wsd <= addWeeks(fromDate, BUFFER_WEEKS)
    const nearEnd = wsd >= subWeeks(toDate, BUFFER_WEEKS)
    if (!nearStart && !nearEnd) return

    let chunkFrom: string
    let chunkTo: string
    let nextRange: { from: string; to: string }
    if (nearStart) {
      chunkTo = loadedRange.from
      chunkFrom = toDateString(subWeeks(fromDate, WINDOW_WEEKS))
      nextRange = { from: chunkFrom, to: loadedRange.to }
    } else {
      chunkFrom = loadedRange.to
      chunkTo = toDateString(addWeeks(toDate, WINDOW_WEEKS))
      nextRange = { from: loadedRange.from, to: chunkTo }
    }

    extendingRef.current = true
    void (async () => {
      const { data, error } = await supabase
        .from('maintenance_entries')
        .select('*')
        .gte('date', chunkFrom)
        .lte('date', chunkTo)
      if (error) {
        console.error('Maintenance window extend failed:', error)
      } else if (data) {
        setStore((s) => {
          const next = { ...s }
          for (const entry of data) {
            const key = slotKey(entry.date, entry.session)
            if (!(key in next)) next[key] = entry.type // fill-if-absent: never clobber local edits
          }
          return next
        })
      }
      setLoadedRange(nextRange)
      extendingRef.current = false
    })()
  }, [weekStart, loadedRange, supabase])

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
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    const SWIPE_MIN = 50
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) goToWeek(addWeeks(weekStartDate, 1)) // swipe left → next week
    else goToWeek(subWeeks(weekStartDate, 1)) // swipe right → previous week
  }

  // Optimistic cell edit: update the store immediately, persist in the background,
  // and revert if the save fails.
  const handleCellChange = (columnKey: string, session: MaintenanceSession, value: WorkoutCellType | null) => {
    const key = slotKey(columnKey, session)
    const previous = store[key] ?? null
    setStore((s) => {
      const next = { ...s }
      if (value) next[key] = value
      else delete next[key]
      return next
    })
    startSave(async () => {
      const result = await upsertMaintenanceEntry(columnKey, session, value)
      if (result?.error) {
        setStore((s) => {
          const next = { ...s }
          if (previous) next[key] = previous
          else delete next[key]
          return next
        })
        setSaveError(result.error)
      }
    })
  }

  // Optimistic bulk action: apply `mutate` to a copy of the store for the displayed
  // week, persist via `persist`, and revert to the snapshot on failure.
  const runBulk = (
    mutate: (next: Record<string, WorkoutCellType>) => void,
    persist: () => Promise<{ error?: string } | void>,
    close: () => void
  ) => {
    const snapshot = store
    setStore((s) => {
      const next = { ...s }
      mutate(next)
      return next
    })
    close()
    startSave(async () => {
      const result = await persist()
      if (result?.error) {
        setStore(snapshot)
        setSaveError(result.error)
      }
    })
  }

  const handlePasteConfirm = () => {
    runBulk(
      (next) => {
        weekDays.forEach((day, i) => {
          const ds = toDateString(day)
          const slot = defaults[DAY_KEYS[i]] ?? { first_session: null, second_session: null }
          for (const session of SESSIONS) {
            const key = slotKey(ds, session)
            const val = slot[session]
            if (val) next[key] = val
            else delete next[key]
          }
        })
      },
      () => pasteDefaultSchedule(weekStart),
      () => setPasteOpen(false)
    )
  }

  const handleRestConfirm = () => {
    runBulk(
      (next) => {
        for (const day of weekDays) {
          const ds = toDateString(day)
          for (const session of SESSIONS) {
            const key = slotKey(ds, session)
            if (!next[key]) next[key] = 'Rest'
          }
        }
      },
      () => fillRestWeek(weekStart),
      () => setRestOpen(false)
    )
  }

  const handleClearConfirm = () => {
    runBulk(
      (next) => {
        for (const day of weekDays) {
          const ds = toDateString(day)
          delete next[slotKey(ds, 'first_session')]
          delete next[slotKey(ds, 'second_session')]
        }
      },
      () => clearMaintenanceWeek(weekStart),
      () => setClearOpen(false)
    )
  }

  // True when the displayed week has at least one populated cell (enables Clear).
  const weekHasEntries = Object.values(values).some((s) => s.first_session || s.second_session)
  // True when at least one cell is empty (enables Fill-Rest).
  const weekHasEmptyCells = Object.values(values).some((s) => !s.first_session || !s.second_session)

  // Weekly summary counts. Non-Rest sessions are counted per cell. Rest is only
  // counted as a full rest day — i.e. when BOTH sessions that day are Rest — so a
  // single Rest paired with a workout (or an empty slot) is not shown. This keeps
  // the summary meaningful instead of inflating it with incidental Rest cells.
  const weekCounts: Record<string, number> = {}
  for (const { first_session, second_session } of Object.values(values)) {
    for (const session of [first_session, second_session]) {
      if (session && session !== 'Rest') {
        weekCounts[session] = (weekCounts[session] || 0) + 1
      }
    }
    if (first_session === 'Rest' && second_session === 'Rest') {
      weekCounts.Rest = (weekCounts.Rest || 0) + 1
    }
  }

  return (
    <div className="space-y-8">
      {/* Background-save failure notice (the optimistic change was rolled back) */}
      {saveError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2"
        >
          <span>{saveError}. Your change wasn&apos;t saved — please try again.</span>
          <button
            onClick={() => setSaveError(null)}
            aria-label="Dismiss error"
            className="shrink-0 rounded p-0.5 hover:bg-destructive/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => goToWeek(subWeeks(weekStartDate, 1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => goToWeek(today)}
            disabled={viewingCurrentWeek}
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
            onClick={() => goToWeek(addWeeks(weekStartDate, 1))}
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
            disabled={!weekHasEmptyCells}
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
            disabled={!weekHasEntries}
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
              <Button variant="ghost" onClick={() => setPasteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePasteConfirm}>Paste Schedule</Button>
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
          <Button variant="ghost" onClick={() => setRestOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRestConfirm}>Fill with Rest</Button>
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
          <Button variant="ghost" onClick={() => setClearOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClearConfirm}>
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
