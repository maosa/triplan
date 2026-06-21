import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Generate a fresh cryptographic nonce for every request.
    // Using crypto.randomUUID() (available in the Next.js Edge runtime),
    // base64-encoded to keep it safe for use in HTTP headers and HTML attributes.
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

    // Next.js dev mode (webpack HMR + React Refresh) evaluates code via eval()/
    // new Function(), which a strict CSP blocks — silently breaking client
    // hydration so the app is inert. Allow 'unsafe-eval' in development only;
    // production builds don't use eval, so the directive stays strict there.
    const scriptSrc =
        process.env.NODE_ENV === 'production'
            ? `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com`
            : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com`

    const csp = [
        "default-src 'self'",
        // 'nonce-...' replaces 'unsafe-inline'. The nonce is passed to <Script>
        // components in layout.tsx so Next.js renders <script nonce="..."> tags.
        scriptSrc,
        // next/font/google self-hosts fonts at build time — no external font CDN needed
        "font-src 'self'",
        // 'unsafe-inline' is intentionally retained for styles only. React renders
        // dynamic colors/layout as inline `style=` *attributes* (workout intensity,
        // chart + maintenance grid templates, range gradient) which a nonce cannot
        // cover, and next/font injects its own inline <style>. Style injection is
        // low risk here: scripts are nonce-locked above and the app renders no
        // user-controlled HTML (no dangerouslySetInnerHTML), so there is no vector
        // to inject a <style>/style attribute in the first place.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        // Supabase API + realtime WS, GA collection endpoints, Sentry ingest (EU region)
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://*.ingest.de.sentry.io",
        "frame-ancestors 'none'",
        // The app embeds no <object>/<embed> and no <iframe>s of its own
        "object-src 'none'",
        "frame-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        // Auto-rewrite any stray http:// subresource to https://
        "upgrade-insecure-requests",
    ].join('; ')

    // Attach the nonce to the forwarded request headers so Server Components
    // can read it via headers() from next/headers (used in app/layout.tsx).
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)

    // Create a new NextRequest with the modified headers so updateSession
    // forwards them to the Server Component render context.
    const modifiedRequest = new NextRequest(request, { headers: requestHeaders })

    // Run Supabase session refresh and auth redirect logic
    const response = await updateSession(modifiedRequest)

    // Set the nonce-based CSP on the response so browsers enforce it
    response.headers.set('Content-Security-Policy', csp)

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
