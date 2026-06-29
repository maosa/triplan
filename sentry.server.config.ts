// Sentry init for the Node.js (server) runtime. Loaded via instrumentation.ts.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Only send events from production so local dev doesn't burn the free-tier
    // error quota or create noise.
    enabled: process.env.NODE_ENV === 'production',
    // Tag events with the Vercel environment (production/preview/development) so
    // preview-deploy noise can be filtered out from the real error feed in the
    // Sentry UI. Falls back to NODE_ENV off-Vercel (e.g. local prod builds).
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    // Errors only — no performance/tracing (separate quota) and no replay.
    tracesSampleRate: 0,
})
