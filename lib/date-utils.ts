import { startOfWeek, addDays, format, isSameMonth, isSameYear } from 'date-fns'

// All maintenance dates are handled as local-midnight Date objects keyed by
// YYYY-MM-DD strings. We avoid `new Date('YYYY-MM-DD')` (which parses as UTC and
// can shift the day in negative timezones) by constructing dates manually.

/** Monday of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

/** The 7 dates (Mon–Sun) of the week starting at `weekStart`. */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** Parse a YYYY-MM-DD string into a local-midnight Date, or null if invalid. */
export function parseDateString(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (isNaN(date.getTime()) || date.getMonth() !== m - 1) return null
  return date
}

/** Format a Date as a YYYY-MM-DD string (local). */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Human-readable label for a Mon–Sun week range:
 * - same month:        "8–14 Jun 2026"
 * - same year:         "29 Jun – 5 Jul 2026"
 * - across year:       "29 Dec 2026 – 4 Jan 2027"
 */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  if (isSameMonth(weekStart, weekEnd)) {
    return `${format(weekStart, 'd')}–${format(weekEnd, 'd MMM yyyy')}`
  }
  if (isSameYear(weekStart, weekEnd)) {
    return `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`
  }
  return `${format(weekStart, 'd MMM yyyy')} – ${format(weekEnd, 'd MMM yyyy')}`
}
