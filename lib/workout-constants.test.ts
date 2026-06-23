import { describe, it, expect } from 'vitest'
import {
    WORKOUT_TYPES,
    WORKOUT_TYPE_SET,
    MAINTENANCE_SESSIONS,
    DAY_KEYS,
} from './workout-constants'

describe('workout constants', () => {
    it('WORKOUT_TYPES has the expected ordered values', () => {
        expect([...WORKOUT_TYPES]).toEqual(['Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other'])
    })
    it('WORKOUT_TYPE_SET membership is case-sensitive and matches the list', () => {
        expect(WORKOUT_TYPE_SET.size).toBe(6)
        expect(WORKOUT_TYPE_SET.has('Swim')).toBe(true)
        expect(WORKOUT_TYPE_SET.has('Other')).toBe(true)
        expect(WORKOUT_TYPE_SET.has('swim')).toBe(false)   // case-sensitive
        expect(WORKOUT_TYPE_SET.has('Stretching')).toBe(false)
        expect(WORKOUT_TYPE_SET.has('')).toBe(false)
    })
    it('MAINTENANCE_SESSIONS and DAY_KEYS are correct', () => {
        expect([...MAINTENANCE_SESSIONS]).toEqual(['first_session', 'second_session'])
        expect([...DAY_KEYS]).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    })
})
