import { describe, it, expect } from 'vitest'
import { validatePassword, MIN_PASSWORD_LENGTH } from './validation'

describe('validatePassword', () => {
    it('enforces the minimum length of 8', () => {
        expect(MIN_PASSWORD_LENGTH).toBe(8)
        expect(validatePassword('1234567')).toBe('Password must be at least 8 characters.') // 7 chars
        expect(validatePassword('')).toBe('Password must be at least 8 characters.')
    })
    it('accepts passwords at or above the minimum', () => {
        expect(validatePassword('12345678')).toBeNull() // exactly 8
        expect(validatePassword('a much longer passphrase')).toBeNull()
    })
})
