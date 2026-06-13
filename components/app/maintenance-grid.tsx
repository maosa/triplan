"use client"

import { cn } from '@/lib/utils'
import { MaintenanceCell } from './maintenance-cell'
import { type WorkoutCellType } from '@/lib/maintenance-colors'
import { type MaintenanceSession } from '@/types/database'

interface GridColumn {
  key: string
  label: string
  sublabel?: string
  isToday?: boolean
}

interface MaintenanceGridProps {
  columns: GridColumn[]
  values: Record<string, { first_session: WorkoutCellType | null; second_session: WorkoutCellType | null }>
  onChange?: (columnKey: string, session: MaintenanceSession, value: WorkoutCellType | null) => void
  readOnly?: boolean
}

const LABEL_COL = 'minmax(2rem, auto)'
const DAY_COLS = 'repeat(7, minmax(0, 1fr))'

// Display labels for the two daily training sessions. These are decoupled from
// time of day (a session could be morning, lunch, or evening) and from the
// stored 'first_session'/'second_session' keys — change here to relabel everywhere
// (live grid + Account Settings defaults editor).
const SESSION_LABELS: Record<MaintenanceSession, string> = { first_session: '1st', second_session: '2nd' }

export function MaintenanceGrid({ columns, values, onChange, readOnly }: MaintenanceGridProps) {
  const getValue = (key: string, session: MaintenanceSession) => values[key]?.[session] ?? null
  const handleChange = (key: string, session: MaintenanceSession, value: WorkoutCellType | null) => {
    onChange?.(key, session, value)
  }

  return (
    <>
      {/* Desktop layout: 7 columns × 2 rows */}
      <div className="hidden sm:block space-y-1.5">
        {/* Header row */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `${LABEL_COL} ${DAY_COLS}` }}>
          <div />
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                'text-center text-xs font-medium pb-1',
                col.isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <div>{col.label}</div>
              {col.sublabel && (
                <div className={cn('text-[10px]', col.isToday ? 'text-primary/80' : 'text-muted-foreground/70')}>
                  {col.sublabel}
                </div>
              )}
              <div className={cn('h-0.5 rounded-full mt-0.5 mx-auto w-4', col.isToday ? 'bg-primary' : 'bg-transparent')} />
            </div>
          ))}
        </div>

        {/* 1st session row */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `${LABEL_COL} ${DAY_COLS}` }}>
          <div className="flex items-center justify-end pr-2">
            <span className="text-xs font-medium text-muted-foreground">{SESSION_LABELS.first_session}</span>
          </div>
          {columns.map((col) => (
            <MaintenanceCell
              key={col.key}
              value={getValue(col.key, 'first_session')}
              onChange={(val) => handleChange(col.key, 'first_session', val)}
              disabled={readOnly}
            />
          ))}
        </div>

        {/* 2nd session row */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `${LABEL_COL} ${DAY_COLS}` }}>
          <div className="flex items-center justify-end pr-2">
            <span className="text-xs font-medium text-muted-foreground">{SESSION_LABELS.second_session}</span>
          </div>
          {columns.map((col) => (
            <MaintenanceCell
              key={col.key}
              value={getValue(col.key, 'second_session')}
              onChange={(val) => handleChange(col.key, 'second_session', val)}
              disabled={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Mobile layout: 2 columns (1st, 2nd) × 7 rows */}
      <div className="sm:hidden space-y-1.5">
        {/* Header row */}
        <div className="grid grid-cols-[5rem_1fr_1fr] gap-1.5">
          <div />
          <div className="text-center text-xs font-medium text-muted-foreground">{SESSION_LABELS.first_session}</div>
          <div className="text-center text-xs font-medium text-muted-foreground">{SESSION_LABELS.second_session}</div>
        </div>

        {/* Day rows */}
        {columns.map((col) => (
          <div key={col.key} className="grid grid-cols-[5rem_1fr_1fr] gap-1.5">
            <div
              className={cn(
                'flex items-center text-xs font-medium',
                col.isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <span className="inline-block w-8 shrink-0">{col.label}</span>
              {col.sublabel && (
                <span className="text-[10px] text-muted-foreground/70">{col.sublabel}</span>
              )}
            </div>
            <MaintenanceCell
              value={getValue(col.key, 'first_session')}
              onChange={(val) => handleChange(col.key, 'first_session', val)}
              disabled={readOnly}
            />
            <MaintenanceCell
              value={getValue(col.key, 'second_session')}
              onChange={(val) => handleChange(col.key, 'second_session', val)}
              disabled={readOnly}
            />
          </div>
        ))}
      </div>
    </>
  )
}
