// Sentry init for the browser. Next.js loads this automatically (15.3+/16).
import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    // Tag events with the Vercel environment so preview-deploy noise can be
    // filtered out from production in the Sentry UI. VERCEL_ENV isn't exposed to
    // the browser by default, so next.config.ts re-exports it as
    // NEXT_PUBLIC_VERCEL_ENV at build time.
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    // Errors only — no performance/tracing and no Session Replay (each is a
    // separate free-tier quota).
    tracesSampleRate: 0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
