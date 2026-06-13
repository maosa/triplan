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

/** seconds -> "H:MM:SS". Returns "" for null. */
export function formatSecondsToHMS(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return ''
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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

/** seconds -> "M:SS" pace. Returns "" for null. */
export function formatSecondsToPace(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}
