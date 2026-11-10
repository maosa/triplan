import type { Metadata } from 'next'

// Static title only — the page itself is a client component, so its metadata lives here.
export const metadata: Metadata = { title: 'Sign up' }

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
