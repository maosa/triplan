import { describe, it, expect } from 'vitest'
import type { Database } from '@/types/database'
import {
    parseHHMM,
    formatMinutesToHHMM,
    getWeekMonday,
    formatWeekLabel,
    buildGlobalWeekRange,
    buildWeeklyData,
} from './chart-utils'

type Workout = Database['public']['Tables']['workouts']['Row']

// Minimal workout factory — only the fields the chart helpers read matter.
function w(over: Partial<Workout>): Workout {
    return {
        type: 'Run',
        date: '2025-03-10',
        duration: null,
        distance: null,
        ...over,
    } as Workout
}

describe('parseHHMM', () => {
    it('parses HH:MM to total minutes', () => {
        expect(parseHHMM('01:30')).toBe(90)
        expect(parseHHMM('00:45')).toBe(45)
        expect(parseHHMM('10:00')).toBe(600)
    })
    it('returns 0 for null/empty/malformed', () => {
        expect(parseHHMM(null)).toBe(0)
        expect(parseHHMM(undefined)).toBe(0)
        expect(parseHHMM('')).toBe(0)
        expect(parseHHMM('90')).toBe(0)        // missing colon
        expect(parseHHMM('1:2:3')).toBe(0)     // too many parts
        expect(parseHHMM('ab:cd')).toBe(0)     // non-numeric
    })
})

describe('formatMinutesToHHMM', () => {
    it('formats minutes as zero-padded HH:MM', () => {
        expect(formatMinutesToHHMM(90)).toBe('01:30')
        expect(formatMinutesToHHMM(45)).toBe('00:45')
        expect(formatMinutesToHHMM(600)).toBe('10:00')
        expect(formatMinutesToHHMM(0)).toBe('00:00')
    })
    it('round-trips with parseHHMM', () => {
        expect(parseHHMM(formatMinutesToHHMM(125))).toBe(125)
    })
})

describe('getWeekMonday', () => {
    it('returns the Monday of the ISO week', () => {
        // 2025-03-12 is a Wednesday -> Monday is 2025-03-10
        const monday = getWeekMonday(new Date('2025-03-12T12:00:00'))
        expect(formatWeekLabel(monday)).toBe('10-Mar-2025')
    })
    it('is idempotent for a date already on Monday', () => {
        const monday = getWeekMonday(new Date('2025-03-10T00:00:00'))
        expect(formatWeekLabel(monday)).toBe('10-Mar-2025')
    })
})

describe('formatWeekLabel', () => {
    it('formats as DD-Mmm-YYYY', () => {
        expect(formatWeekLabel(new Date('2025-03-10T00:00:00'))).toBe('10-Mar-2025')
        expect(formatWeekLabel(new Date('2025-12-01T00:00:00'))).toBe('01-Dec-2025')
    })
})

describe('buildGlobalWeekRange', () => {
    it('returns null when there are no workouts', () => {
        expect(buildGlobalWeekRange([], '2025-03-30')).toBeNull()
    })
    it('spans from the earliest workout Monday to the race Monday, across all types', () => {
        const workouts = [
            w({ type: 'Run', date: '2025-03-12' }),  // week of 10-Mar
            w({ type: 'Swim', date: '2025-03-03' }), // week of 03-Mar (earliest)
            w({ type: 'Bike', date: '2025-03-20' }),
        ]
        const range = buildGlobalWeekRange(workouts, '2025-03-30')
        expect(range).not.toBeNull()
        expect(formatWeekLabel(range!.from)).toBe('03-Mar-2025')
        expect(formatWeekLabel(range!.to)).toBe('24-Mar-2025') // Monday of race week
    })
})

describe('buildWeeklyData', () => {
    it('returns [] when no workouts match the type', () => {
        const workouts = [w({ type: 'Swim', date: '2025-03-10', duration: '01:00' })]
        expect(buildWeeklyData(workouts, 'Run', 'duration', '2025-03-17')).toEqual([])
    })
    it('returns [] for duration when matching workouts have no duration data', () => {
        const workouts = [w({ type: 'Run', date: '2025-03-10', duration: null })]
        expect(buildWeeklyData(workouts, 'Run', 'duration', '2025-03-17')).toEqual([])
    })
    it('returns [] for distance when matching workouts have no distance data', () => {
        const workouts = [w({ type: 'Run', date: '2025-03-10', distance: null })]
        expect(buildWeeklyData(workouts, 'Run', 'distance', '2025-03-17')).toEqual([])
    })
    it('sums duration (minutes) per week and fills empty weeks with 0', () => {
        const workouts = [
            w({ type: 'Run', date: '2025-03-10', duration: '01:00' }),
            w({ type: 'Run', date: '2025-03-12', duration: '00:30' }),
        ]
        const data = buildWeeklyData(workouts, 'Run', 'duration', '2025-03-24')
        expect(data).toEqual([
            { week: '10-Mar-2025', value: 90 },
            { week: '17-Mar-2025', value: 0 },
            { week: '24-Mar-2025', value: 0 },
        ])
    })
    it('sums distance per week', () => {
        const workouts = [
            w({ type: 'Bike', date: '2025-03-10', distance: 20 }),
            w({ type: 'Bike', date: '2025-03-11', distance: 5.5 }),
        ]
        const data = buildWeeklyData(workouts, 'Bike', 'distance', '2025-03-10')
        expect(data).toEqual([{ week: '10-Mar-2025', value: 25.5 }])
    })
    it('counts workouts per week regardless of duration/distance presence', () => {
        const workouts = [
            w({ type: 'Run', date: '2025-03-10' }),
            w({ type: 'Run', date: '2025-03-12' }),
            w({ type: 'Run', date: '2025-03-17' }),
        ]
        const data = buildWeeklyData(workouts, 'Run', 'count', '2025-03-17')
        expect(data).toEqual([
            { week: '10-Mar-2025', value: 2 },
            { week: '17-Mar-2025', value: 1 },
        ])
    })
    it('respects a forced range and ignores workouts outside it', () => {
        const workouts = [
            w({ type: 'Run', date: '2025-03-10', duration: '01:00' }),
            w({ type: 'Run', date: '2025-04-07', duration: '02:00' }), // outside forced range
        ]
        const forced = {
            from: getWeekMonday(new Date('2025-03-10T00:00:00')),
            to: getWeekMonday(new Date('2025-03-17T00:00:00')),
        }
        const data = buildWeeklyData(workouts, 'Run', 'duration', '2025-03-17', forced)
        expect(data).toEqual([
            { week: '10-Mar-2025', value: 60 },
            { week: '17-Mar-2025', value: 0 },
        ])
    })
})
