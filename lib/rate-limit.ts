import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting for auth endpoints, backed by Upstash Redis.
//
// Design notes:
// - FAIL-OPEN: if the env vars are missing (e.g. local dev without Upstash) or
//   Redis is unreachable, requests are ALLOWED. Rate limiting must never take
//   down auth or block local development.
// - Free-tier friendly: `analytics: false` (no extra writes) and a per-instance
//   in-memory `ephemeralCache` so repeated blocked attempts short-circuit
//   without hitting Redis.
// - Sliding-window limiters; tune the numbers here in one place.

const isConfigured =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

// Shared in-memory cache across limiters (blocked identifiers skip Redis).
const ephemeralCache = new Map<string, number>()

const redis = isConfigured ? Redis.fromEnv() : null

function makeLimiter(limit: number, window: Parameters<typeof Ratelimit.slidingWindow>[1], prefix: string) {
    if (!redis) return null
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: false,
        ephemeralCache,
        prefix,
    })
}

// Auth limiters. Keep limits conservative; adjust here as needed.
const limiters = {
    login: makeLimiter(5, '15 m', 'rl:login'),
    signup: makeLimiter(3, '1 h', 'rl:signup'),
    resetPassword: makeLimiter(3, '1 h', 'rl:reset'),
}

export type RateLimitName = keyof typeof limiters

/**
 * Returns `true` if the request is allowed, `false` if it should be blocked.
 * Fails open: any misconfiguration or Redis error resolves to `true`.
 */
export async function checkRateLimit(name: RateLimitName, identifier: string): Promise<boolean> {
    const limiter = limiters[name]
    if (!limiter) return true // not configured → allow
    try {
        const { success } = await limiter.limit(identifier)
        return success
    } catch (error) {
        console.error(`[rate-limit] ${name} check failed; allowing request:`, error)
        return true // fail open
    }
}
