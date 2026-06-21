import * as Sentry from '@sentry/nextjs'

// Loads the right Sentry config per runtime, and forwards Next.js request errors
// (server components, route handlers, server actions) to Sentry.
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config')
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config')
    }
}

export const onRequestError = Sentry.captureRequestError
