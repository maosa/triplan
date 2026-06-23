import { describe, it, expect } from 'vitest'
import {
    getWeekStart,
    getWeekDays,
    parseDateString,
    toDateString,
    formatWeekRange,
} from './date-utils'

describe('parseDateString', () => {
    it('parses valid YYYY-MM-DD to a local-midnight date', () => {
        const d = parseDateString('2026-06-23')
        expect(d).not.toBeNull()
        expect(d!.getFullYear()).toBe(2026)
        expect(d!.getMonth()).toBe(5) // June (0-indexed)
        expect(d!.getDate()).toBe(23)
        expect(d!.getHours()).toBe(0)
    })
    it('accepts a valid leap day', () => {
        expect(parseDateString('2024-02-29')).not.toBeNull()
    })
    it('rejects impossible/rolled-over dates', () => {
        expect(parseDateString('2026-02-30')).toBeNull()
        expect(parseDateString('2025-02-29')).toBeNull() // not a leap year
        expect(parseDateString('2026-13-01')).toBeNull()
    })
    it('rejects bad formats, blanks, and nullish input', () => {
        expect(parseDateString('2026/06/23')).toBeNull()
        expect(parseDateString('06-23-2026')).toBeNull()
        expect(parseDateString('2026-6-23')).toBeNull() // not zero-padded
        expect(parseDateString(' 2026-06-23 ')).toBeNull() // no trim
        expect(parseDateString('')).toBeNull()
        expect(parseDateString(null)).toBeNull()
        expect(parseDateString(undefined)).toBeNull()
    })
})

describe('toDateString', () => {
    it('formats a date as YYYY-MM-DD (local)', () => {
        expect(toDateString(new Date(2026, 5, 8))).toBe('2026-06-08')
        expect(toDateString(new Date(2027, 0, 3))).toBe('2027-01-03')
    })
    it('round-trips with parseDateString', () => {
        const s = '2026-06-23'
        expect(toDateString(parseDateString(s)!)).toBe(s)
    })
})

describe('getWeekStart', () => {
    it('returns the Monday of the week (weekStartsOn Monday)', () => {
        // 2026-06-14 is a Sunday; its week starts Monday 2026-06-08.
        expect(toDateString(getWeekStart(parseDateString('2026-06-14')!))).toBe('2026-06-08')
        // A Monday maps to itself.
        expect(toDateString(getWeekStart(parseDateString('2026-06-08')!))).toBe('2026-06-08')
    })
})

describe('getWeekDays', () => {
    it('returns 7 consecutive days Mon..Sun', () => {
        const days = getWeekDays(parseDateString('2026-06-08')!)
        expect(days).toHaveLength(7)
        expect(toDateString(days[0])).toBe('2026-06-08')
        expect(toDateString(days[6])).toBe('2026-06-14')
    })
})

describe('formatWeekRange', () => {
    it('same month: "8–14 Jun 2026"', () => {
        expect(formatWeekRange(new Date(2026, 5, 8))).toBe('8–14 Jun 2026')
    })
    it('same year, crossing month: "29 Jun – 5 Jul 2026"', () => {
        expect(formatWeekRange(new Date(2026, 5, 29))).toBe('29 Jun – 5 Jul 2026')
    })
    it('crossing the year boundary: "28 Dec 2026 – 3 Jan 2027"', () => {
        expect(formatWeekRange(new Date(2026, 11, 28))).toBe('28 Dec 2026 – 3 Jan 2027')
    })
})
