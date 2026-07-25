// Sentry init for the Edge runtime (middleware, edge routes). Loaded via instrumentation.ts.
import * as Sentry from '@sentry/nextjs'
import { dropBenignNetworkErrors } from '@/lib/sentry-filter'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    // See sentry.server.config.ts for why environment is tagged from VERCEL_ENV.
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    // See sentry.server.config.ts — drop network-abort noise.
    beforeSend: dropBenignNetworkErrors,
    tracesSampleRate: 0,
})
