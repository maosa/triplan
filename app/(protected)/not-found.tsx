import Link from 'next/link'
import { Header } from '@/components/app/header'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
                <p className="text-5xl font-bold tracking-tight">404</p>
                <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
                <p className="mt-2 text-muted-foreground">
                    This race or page doesn&apos;t exist, or you don&apos;t have access to it.
                </p>
                <Link
                    href="/races"
                    className="mt-8 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    Back to Races
                </Link>
            </main>
        </div>
    )
}
