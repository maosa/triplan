import { describe, it, expect } from 'vitest'
import {
    isValidTimeString,
    isValidPaceString,
    parseTimeToSeconds,
    formatSecondsToHMS,
    parsePaceToSeconds,
    formatSecondsToPace,
    maskTimeInput,
    maskPaceInput,
    sanitizeDecimalInput,
} from './time-format'

describe('isValidTimeString', () => {
    it('accepts H:MM:SS and M:SS', () => {
        expect(isValidTimeString('00:00:00')).toBe(true)
        expect(isValidTimeString('1:23:45')).toBe(true)
        expect(isValidTimeString('999:59:59')).toBe(true)
        expect(isValidTimeString('23:45')).toBe(true)
        expect(isValidTimeString('99:59')).toBe(true)
    })
    it('rejects malformed / out-of-range', () => {
        expect(isValidTimeString('0:0:0')).toBe(false)   // single-digit M/S
        expect(isValidTimeString('1:60:00')).toBe(false) // minutes > 59
        expect(isValidTimeString('1:23:60')).toBe(false) // seconds > 59
        expect(isValidTimeString('1000:00:00')).toBe(false) // 4-digit hours
        expect(isValidTimeString('abc')).toBe(false)
        expect(isValidTimeString('')).toBe(false)
    })
})

describe('isValidPaceString', () => {
    it('accepts MM:SS', () => {
        expect(isValidPaceString('5:30')).toBe(true)
        expect(isValidPaceString('99:59')).toBe(true)
    })
    it('rejects out-of-range / wrong shape', () => {
        expect(isValidPaceString('99:60')).toBe(false)
        expect(isValidPaceString('1:23:45')).toBe(false)
        expect(isValidPaceString('')).toBe(false)
    })
})

describe('parseTimeToSeconds', () => {
    it('parses H:MM:SS, M:SS, and bare seconds', () => {
        expect(parseTimeToSeconds('0:00:00')).toBe(0)
        expect(parseTimeToSeconds('01:23:45')).toBe(5025)
        expect(parseTimeToSeconds('999:59:59')).toBe(3599999)
        expect(parseTimeToSeconds('99:59')).toBe(5999)
        expect(parseTimeToSeconds('3661')).toBe(3661)
        expect(parseTimeToSeconds('007')).toBe(7)
    })
    it('trims surrounding whitespace', () => {
        expect(parseTimeToSeconds('  01:23:45  ')).toBe(5025)
    })
    it('returns null for blank or invalid', () => {
        expect(parseTimeToSeconds('')).toBeNull()
        expect(parseTimeToSeconds('   ')).toBeNull()
        expect(parseTimeToSeconds('1:60:00')).toBeNull()
        expect(parseTimeToSeconds('1:23:60')).toBeNull()
        expect(parseTimeToSeconds('1-23-45')).toBeNull()
        expect(parseTimeToSeconds('-30')).toBeNull()
    })
})

describe('formatSecondsToHMS', () => {
    it('zero-pads and formats', () => {
        expect(formatSecondsToHMS(0)).toBe('00:00:00')
        expect(formatSecondsToHMS(5025)).toBe('01:23:45')
        expect(formatSecondsToHMS(3599999)).toBe('999:59:59')
    })
    it('returns empty string for null/undefined', () => {
        expect(formatSecondsToHMS(null)).toBe('')
        expect(formatSecondsToHMS(undefined as unknown as null)).toBe('')
    })
    it('round-trips with parseTimeToSeconds', () => {
        expect(parseTimeToSeconds(formatSecondsToHMS(5025))).toBe(5025)
    })
})

describe('parsePaceToSeconds / formatSecondsToPace', () => {
    it('parses MM:SS', () => {
        expect(parsePaceToSeconds('1:45')).toBe(105)
        expect(parsePaceToSeconds('00:30')).toBe(30)
    })
    it('returns null for invalid pace', () => {
        expect(parsePaceToSeconds('')).toBeNull()
        expect(parsePaceToSeconds('1:60')).toBeNull()
        expect(parsePaceToSeconds('1:23:45')).toBeNull()
    })
    it('formats seconds to MM:SS', () => {
        expect(formatSecondsToPace(105)).toBe('01:45')
        expect(formatSecondsToPace(0)).toBe('00:00')
        expect(formatSecondsToPace(null)).toBe('')
    })
})

describe('maskTimeInput', () => {
    it('groups digits into HH:MM:SS, stripping non-digits and capping at 6', () => {
        expect(maskTimeInput('')).toBe('')
        expect(maskTimeInput('12')).toBe('12')
        expect(maskTimeInput('123')).toBe('12:3')
        expect(maskTimeInput('1234')).toBe('12:34')
        expect(maskTimeInput('12345')).toBe('12:34:5')
        expect(maskTimeInput('123456')).toBe('12:34:56')
        expect(maskTimeInput('12345678')).toBe('12:34:56') // capped at 6
        expect(maskTimeInput('1a2b3c')).toBe('12:3')
        expect(maskTimeInput('abc')).toBe('')
    })
})

describe('maskPaceInput', () => {
    it('groups digits into MM:SS, capped at 4', () => {
        expect(maskPaceInput('12')).toBe('12')
        expect(maskPaceInput('123')).toBe('12:3')
        expect(maskPaceInput('1234')).toBe('12:34')
        expect(maskPaceInput('123456')).toBe('12:34') // capped at 4
    })
})

describe('sanitizeDecimalInput', () => {
    it('keeps digits and a single dot, strips the rest', () => {
        expect(sanitizeDecimalInput('123.45')).toBe('123.45')
        expect(sanitizeDecimalInput('-123.45')).toBe('123.45') // minus stripped
        expect(sanitizeDecimalInput('$12.50')).toBe('12.50')
        expect(sanitizeDecimalInput('1.2.3.4')).toBe('1.234')  // only first dot kept
        expect(sanitizeDecimalInput('5..')).toBe('5.')
        expect(sanitizeDecimalInput('.5')).toBe('.5')
        expect(sanitizeDecimalInput('abc')).toBe('')
    })
})
