import { describe, it, expect } from 'vitest'
import { MAINTENANCE_TYPE_STYLES, MAINTENANCE_TYPE_ORDER } from './maintenance-colors'
import { WORKOUT_TYPES } from './workout-constants'

describe('maintenance colors', () => {
    it('has a style entry for every workout type', () => {
        for (const type of WORKOUT_TYPES) {
            expect(MAINTENANCE_TYPE_STYLES[type]).toBeDefined()
        }
        expect(Object.keys(MAINTENANCE_TYPE_STYLES)).toHaveLength(WORKOUT_TYPES.length)
    })
    it('each entry provides a badge class string and an icon component', () => {
        for (const type of WORKOUT_TYPES) {
            const style = MAINTENANCE_TYPE_STYLES[type]
            expect(typeof style.badge).toBe('string')
            expect(style.badge.length).toBeGreaterThan(0)
            expect(style.icon).toBeTruthy()
        }
    })
    it('orders types to match the canonical workout type list', () => {
        expect([...MAINTENANCE_TYPE_ORDER]).toEqual([...WORKOUT_TYPES])
    })
})
