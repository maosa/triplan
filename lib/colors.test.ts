import { describe, it, expect } from 'vitest'
import { getIntensityColor, getDiscreteGradient } from './colors'

describe('getIntensityColor', () => {
    it('maps 0→green (hue 120), 10→red (hue 0), 5→yellow (hue 60)', () => {
        expect(getIntensityColor(0)).toBe('hsl(120, 85%, 50%)')
        expect(getIntensityColor(10)).toBe('hsl(0, 85%, 50%)')
        expect(getIntensityColor(5)).toBe('hsl(60, 85%, 50%)')
    })
})

describe('getDiscreteGradient', () => {
    it('produces a valid linear-gradient with 21 hard-stop steps', () => {
        const g = getDiscreteGradient()
        expect(g.startsWith('linear-gradient(to right, ')).toBe(true)
        // 21 steps, each emitting the colour twice (start% and end%) ⇒ 42 hsl() tokens.
        expect((g.match(/hsl\(/g) ?? []).length).toBe(42)
        // endpoints present: intensity 0 (green) and 10 (red)
        expect(g).toContain('hsl(120, 85%, 50%)')
        expect(g).toContain('hsl(0, 85%, 50%)')
    })
})
