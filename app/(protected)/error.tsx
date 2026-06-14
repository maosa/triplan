'use client'

import { useEffect } from 'react'
import { Header } from '@/components/app/header'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Surface the error to the server logs / monitoring for debugging.
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
                <h1 className="text-xl font-semibold">Something went wrong</h1>
                <p className="mt-2 text-muted-foreground">
                    An unexpected error occurred. Please try again.
                </p>
                <Button onClick={reset} className="mt-8">
                    Try again
                </Button>
            </main>
        </div>
    )
}
