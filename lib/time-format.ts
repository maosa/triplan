// Helpers for converting between display strings and stored integer seconds.
// Times (durations) accept H:MM:SS, M:SS, or bare seconds. Paces accept MM:SS.

// Up to 999 hours for ultra distances: H:MM:SS, or M:SS (treated as 0 hours).
const TIME_HMS_REGEX = /^\d{1,3}:[0-5]\d:[0-5]\d$/
const TIME_MS_REGEX = /^\d{1,2}:[0-5]\d$/
const PACE_REGEX = /^\d{1,2}:[0-5]\d$/

/** True if `value` is a valid H:MM:SS or M:SS time string. */
export function isValidTimeString(value: string): boolean {
    return TIME_HMS_REGEX.test(value) || TIME_MS_REGEX.test(value)
}

/** True if `value` is a valid MM:SS pace string. */
export function isValidPaceString(value: string): boolean {
    return PACE_REGEX.test(value)
}

/**
 * "1:23:45" (H:MM:SS) or "23:45" (M:SS) or "45" (bare seconds) -> seconds.
 * Returns null for blank/invalid input.
 */
export function parseTimeToSeconds(value: string): number | null {
    const v = value.trim()
    if (!v) return null

    if (TIME_HMS_REGEX.test(v)) {
        const [h, m, s] = v.split(':').map(Number)
        return h * 3600 + m * 60 + s
    }
    if (TIME_MS_REGEX.test(v)) {
        const [m, s] = v.split(':').map(Number)
        return m * 60 + s
    }
    if (/^\d+$/.test(v)) {
        return Number(v)
    }
    return null
}

/** seconds -> "HH:MM:SS" (zero-padded). Returns "" for null. */
export function formatSecondsToHMS(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return ''
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** "1:45" (MM:SS) -> seconds. Returns null for blank/invalid input. */
export function parsePaceToSeconds(value: string): number | null {
    const v = value.trim()
    if (!v) return null
    if (PACE_REGEX.test(v)) {
        const [m, s] = v.split(':').map(Number)
        return m * 60 + s
    }
    return null
}

/** seconds -> "MM:SS" pace (zero-padded). Returns "" for null. */
export function formatSecondsToPace(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Live input mask: digits -> "HH:MM:SS" (max 6 digits, grouped left-to-right). */
export function maskTimeInput(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 6)
    if (d.length > 4) return `${d.slice(0, 2)}:${d.slice(2, 4)}:${d.slice(4)}`
    if (d.length > 2) return `${d.slice(0, 2)}:${d.slice(2)}`
    return d
}

/** Live input mask: digits -> "MM:SS" (max 4 digits). */
export function maskPaceInput(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 4)
    if (d.length > 2) return `${d.slice(0, 2)}:${d.slice(2)}`
    return d
}

/** Input sanitizer for non-negative decimals: keeps digits and a single dot. */
export function sanitizeDecimalInput(value: string): string {
    let v = value.replace(/[^\d.]/g, '') // drop minus sign, letters, etc.
    const dot = v.indexOf('.')
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '')
    return v
}
