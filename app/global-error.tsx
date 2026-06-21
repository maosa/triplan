'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Catches errors thrown in the root layout (where the per-segment error.tsx
// can't), reports them to Sentry, and renders a minimal fallback document.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html>
            <body>
                <main style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h1>
                    <p style={{ marginTop: '0.5rem', color: '#71717a' }}>An unexpected error occurred. Please reload the page.</p>
                </main>
            </body>
        </html>
    )
}
