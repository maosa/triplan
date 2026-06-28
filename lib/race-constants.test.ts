import { describe, it, expect } from 'vitest'
import {
    RACE_TYPES,
    RACE_TYPE_SET,
    RACE_TYPE_LABELS,
    effectiveRaceType,
    sectionsForRaceType,
} from './race-constants'

describe('race constants', () => {
    it('RACE_TYPES has the expected ordered values', () => {
        expect([...RACE_TYPES]).toEqual(['swim', 'bike', 'run', 'triathlon'])
    })

    it('RACE_TYPE_SET membership is case-sensitive and matches the list', () => {
        expect(RACE_TYPE_SET.size).toBe(4)
        expect(RACE_TYPE_SET.has('swim')).toBe(true)
        expect(RACE_TYPE_SET.has('triathlon')).toBe(true)
        expect(RACE_TYPE_SET.has('Swim')).toBe(false) // case-sensitive
        expect(RACE_TYPE_SET.has('marathon')).toBe(false)
        expect(RACE_TYPE_SET.has('')).toBe(false)
    })

    it('RACE_TYPE_LABELS title-cases each type', () => {
        expect(RACE_TYPE_LABELS).toEqual({
            swim: 'Swim',
            bike: 'Bike',
            run: 'Run',
            triathlon: 'Triathlon',
        })
    })
})

describe('effectiveRaceType', () => {
    it('passes through valid types', () => {
        expect(effectiveRaceType('swim')).toBe('swim')
        expect(effectiveRaceType('bike')).toBe('bike')
        expect(effectiveRaceType('run')).toBe('run')
        expect(effectiveRaceType('triathlon')).toBe('triathlon')
    })

    it('treats null / undefined / unknown as triathlon (legacy rows)', () => {
        expect(effectiveRaceType(null)).toBe('triathlon')
        expect(effectiveRaceType(undefined)).toBe('triathlon')
        expect(effectiveRaceType('')).toBe('triathlon')
        expect(effectiveRaceType('marathon')).toBe('triathlon')
    })
})

describe('sectionsForRaceType', () => {
    it('single-sport races only include their own discipline', () => {
        expect([...sectionsForRaceType('swim')]).toEqual(['swim'])
        expect([...sectionsForRaceType('bike')]).toEqual(['bike'])
        expect([...sectionsForRaceType('run')]).toEqual(['run'])
    })

    it('triathlon includes both transitions and all three disciplines', () => {
        expect([...sectionsForRaceType('triathlon')]).toEqual(['swim', 't1', 'bike', 't2', 'run'])
    })

    it('legacy null type behaves as triathlon', () => {
        expect([...sectionsForRaceType(null)]).toEqual(['swim', 't1', 'bike', 't2', 'run'])
    })
})
