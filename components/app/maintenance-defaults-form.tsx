"use client"

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { MaintenanceGrid } from './maintenance-grid'
import { useToast } from '@/components/ui/toast'
import { updateMaintenanceDefaults } from '@/app/actions'
import { type WorkoutCellType } from '@/lib/maintenance-colors'
import { type MaintenanceDefaults, type MaintenanceSession } from '@/types/database'

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
] as const

function emptySchedule(): MaintenanceDefaults {
  return Object.fromEntries(DAYS.map((d) => [d.key, { first_session: null, second_session: null }]))
}

function seedFromDefaults(defaults: MaintenanceDefaults): MaintenanceDefaults {
  const base = emptySchedule()
  for (const day of DAYS) {
    const slot = defaults[day.key]
    if (slot) base[day.key] = { first_session: slot.first_session ?? null, second_session: slot.second_session ?? null }
  }
  return base
}

export function MaintenanceDefaultsForm({ initialDefaults }: { initialDefaults: MaintenanceDefaults }) {
  const [schedule, setSchedule] = useState<MaintenanceDefaults>(() => seedFromDefaults(initialDefaults))
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleChange = (key: string, session: MaintenanceSession, value: WorkoutCellType | null) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], [session]: value },
    }))
  }

  const handleClear = () => setSchedule(emptySchedule())

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('schedule', JSON.stringify(schedule))
      const result = await updateMaintenanceDefaults(formData)
      if (result?.error) toast(result.error, 'error')
      else toast('Schedule saved.', 'success')
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <MaintenanceGrid
        columns={DAYS.map((d) => ({ key: d.key, label: d.label, isToday: false }))}
        values={schedule}
        onChange={handleChange}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Button type="button" onClick={handleSave} isLoading={isPending}>
          Save Schedule
        </Button>
        <Button type="button" variant="ghost" onClick={handleClear} disabled={isPending}>
          Clear
        </Button>
      </div>
    </div>
  )
}
