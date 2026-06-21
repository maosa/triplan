// Sentry init for the browser. Next.js loads this automatically (15.3+/16).
import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    // Errors only — no performance/tracing and no Session Replay (each is a
    // separate free-tier quota).
    tracesSampleRate: 0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
