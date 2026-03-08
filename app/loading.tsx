export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header skeleton */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                    <div className="h-6 w-20 rounded bg-muted animate-pulse" />
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:px-8 space-y-12">
                {/* Race cards skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-4"
                        >
                            <div className="flex items-start justify-between">
                                <div className="h-6 w-48 rounded bg-muted animate-pulse" />
                                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
