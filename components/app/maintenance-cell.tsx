"use client"

import { MAINTENANCE_TYPE_STYLES, MAINTENANCE_TYPE_ORDER, type WorkoutCellType } from '@/lib/maintenance-colors'
import { cn } from '@/lib/utils'

interface MaintenanceCellProps {
  value: WorkoutCellType | null
  onChange: (value: WorkoutCellType | null) => void
  disabled?: boolean
}

export function MaintenanceCell({ value, onChange, disabled }: MaintenanceCellProps) {
  const style = value ? MAINTENANCE_TYPE_STYLES[value] : null
  const Icon = style?.icon

  return (
    <div className="relative h-9 w-full">
      <div
        className={cn(
          'h-full w-full rounded-md flex items-center justify-center gap-1 text-xs font-medium select-none',
          value
            ? style!.badge
            : 'border border-dashed border-border bg-muted/30'
        )}
      >
        {value && Icon && (
          <>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{value}</span>
          </>
        )}
      </div>
      {!disabled && (
        <select
          value={value ?? ''}
          onChange={(e) => onChange((e.target.value || null) as WorkoutCellType | null)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          aria-label={value ? `Change session type (currently ${value})` : 'Set session type'}
        >
          <option value="">—</option>
          {MAINTENANCE_TYPE_ORDER.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      )}
    </div>
  )
}
