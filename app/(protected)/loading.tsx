export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header skeleton with back button */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-8 w-28 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:px-8 space-y-8">
                {/* Title skeleton */}
                <div className="space-y-2">
                    <div className="h-8 w-64 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                </div>

                {/* Content skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                                <div className="space-y-1.5">
                                    <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                                </div>
                            </div>
                            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
