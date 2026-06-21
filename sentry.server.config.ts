// Sentry init for the Node.js (server) runtime. Loaded via instrumentation.ts.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Only send events from production so local dev doesn't burn the free-tier
    // error quota or create noise.
    enabled: process.env.NODE_ENV === 'production',
    // Errors only — no performance/tracing (separate quota) and no replay.
    tracesSampleRate: 0,
})
