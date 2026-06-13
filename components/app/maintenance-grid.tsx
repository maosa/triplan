"use client"

import { cn } from '@/lib/utils'
import { MaintenanceCell } from './maintenance-cell'
import { type WorkoutCellType } from '@/lib/maintenance-colors'

interface GridColumn {
  key: string
  label: string
  sublabel?: string
  isToday?: boolean
}

interface MaintenanceGridProps {
  columns: GridColumn[]
  values: Record<string, { am: WorkoutCellType | null; pm: WorkoutCellType | null }>
  onChange?: (columnKey: string, session: 'am' | 'pm', value: WorkoutCellType | null) => void
  readOnly?: boolean
}

const LABEL_COL = 'minmax(2rem, auto)'
const DAY_COLS = 'repeat(7, minmax(0, 1fr))'

export function MaintenanceGrid({ columns, values, onChange, readOnly }: MaintenanceGridProps) {
  const getValue = (key: string, session: 'am' | 'pm') => values[key]?.[session] ?? null
  const handleChange = (key: string, session: 'am' | 'pm', value: WorkoutCellType | null) => {
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

        {/* AM row */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `${LABEL_COL} ${DAY_COLS}` }}>
          <div className="flex items-center justify-end pr-2">
            <span className="text-xs font-medium text-muted-foreground">AM</span>
          </div>
          {columns.map((col) => (
            <MaintenanceCell
              key={col.key}
              value={getValue(col.key, 'am')}
              onChange={(val) => handleChange(col.key, 'am', val)}
              disabled={readOnly}
            />
          ))}
        </div>

        {/* PM row */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `${LABEL_COL} ${DAY_COLS}` }}>
          <div className="flex items-center justify-end pr-2">
            <span className="text-xs font-medium text-muted-foreground">PM</span>
          </div>
          {columns.map((col) => (
            <MaintenanceCell
              key={col.key}
              value={getValue(col.key, 'pm')}
              onChange={(val) => handleChange(col.key, 'pm', val)}
              disabled={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Mobile layout: 2 columns (AM, PM) × 7 rows */}
      <div className="sm:hidden space-y-1.5">
        {/* Header row */}
        <div className="grid grid-cols-[5rem_1fr_1fr] gap-1.5">
          <div />
          <div className="text-center text-xs font-medium text-muted-foreground">AM</div>
          <div className="text-center text-xs font-medium text-muted-foreground">PM</div>
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
              {col.label}
              {col.sublabel && (
                <span className="ml-1 text-[10px] text-muted-foreground/70">{col.sublabel}</span>
              )}
            </div>
            <MaintenanceCell
              value={getValue(col.key, 'am')}
              onChange={(val) => handleChange(col.key, 'am', val)}
              disabled={readOnly}
            />
            <MaintenanceCell
              value={getValue(col.key, 'pm')}
              onChange={(val) => handleChange(col.key, 'pm', val)}
              disabled={readOnly}
            />
          </div>
        ))}
      </div>
    </>
  )
}
