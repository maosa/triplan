import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only allow same-origin relative paths as redirect targets. Rejects absolute
// URLs (`http://evil.com`) and protocol-relative URLs (`//evil.com`) so a
// crafted `next` param can't turn the login callback into an open redirect.
function safeNext(next: string | null): string {
    if (!next || !next.startsWith('/') || next.startsWith('//')) return '/'
    return next
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = safeNext(searchParams.get('next'))

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/login`)
}
