import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent embedding in iframes (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy XSS protection (belt-and-suspenders for older browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Enforce HTTPS for 2 years, including subdomains (production only — safe to send in all envs since Vercel always serves HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Restrict access to browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Content-Security-Policy is set dynamically in middleware.ts with a per-request
  // nonce, replacing 'unsafe-inline'. Do not add a static CSP entry here.
]

const nextConfig: NextConfig = {
  // Re-export Vercel's VERCEL_ENV to the browser bundle so the client-side
  // Sentry init can tag events with the environment (it only inlines
  // NEXT_PUBLIC_* vars). Resolved at build time; undefined off-Vercel.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ],
};

export default withSentryConfig(nextConfig, {
  // Org/project on Sentry's EU region. The auth token (SENTRY_AUTH_TOKEN, build-
  // time only) enables source-map upload so production stack traces are readable.
  org: "maosa-em",
  project: "triplan",
  sentryUrl: "https://de.sentry.io",
  // Quieter build output; only logs upload issues.
  silent: !process.env.CI,
  // Upload a wider set of source maps for better stack traces.
  widenClientFileUpload: true,
});
