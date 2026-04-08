import type { NextConfig } from "next";

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
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
