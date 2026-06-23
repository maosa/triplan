import { describe, it, expect } from 'vitest'
import { safeNext } from './safe-redirect'

describe('safeNext (open-redirect guard)', () => {
    it('falls back to "/" for nullish, empty, or non-relative targets', () => {
        expect(safeNext(null)).toBe('/')
        expect(safeNext('')).toBe('/')
        expect(safeNext('evil.com')).toBe('/')
        expect(safeNext('http://evil.com')).toBe('/')
        expect(safeNext('https://evil.com')).toBe('/')
        expect(safeNext('//evil.com')).toBe('/')        // protocol-relative
        expect(safeNext('///evil.com')).toBe('/')
        expect(safeNext(' /races')).toBe('/')            // leading space ⇒ not relative
    })
    it('allows same-origin relative paths', () => {
        expect(safeNext('/')).toBe('/')
        expect(safeNext('/races')).toBe('/races')
        expect(safeNext('/reset-password')).toBe('/reset-password')
        expect(safeNext('/page?q=1&x=2#anchor')).toBe('/page?q=1&x=2#anchor')
    })
})
