import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
    it('joins truthy class names', () => {
        expect(cn('a', 'b', 'c')).toBe('a b c')
    })
    it('drops falsy values', () => {
        expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
    })
    it('supports conditional object syntax', () => {
        expect(cn('base', { active: true, disabled: false })).toBe('base active')
    })
    it('flattens arrays', () => {
        expect(cn(['a', 'b'], ['c'])).toBe('a b c')
    })
    it('merges conflicting tailwind utilities, last one wins', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4')
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })
    it('keeps non-conflicting tailwind utilities', () => {
        expect(cn('px-2 py-1', 'mt-3')).toBe('px-2 py-1 mt-3')
    })
    it('returns an empty string for no/empty input', () => {
        expect(cn()).toBe('')
        expect(cn(false, null, undefined)).toBe('')
    })
})
