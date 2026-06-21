import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies, headers } from "next/headers";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TriPlan",
  description: "Plan and track your triathlon training for Ironman, T100, and other races with TriPlan. Built for serious endurance athletes to organise races, track workouts, and stay race-ready.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme from cookie — no DB query needed on every navigation.
  // When no cookie exists (logged-out visitors on the landing/auth pages), we
  // leave the class unset and let the inline pre-paint script below resolve it
  // from the OS preference. Logged-in users always have the cookie (set on
  // login / profile change), so their pages keep matching their account theme.
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value

  // Read the per-request nonce injected by middleware.ts.
  // Passing it to <Script> causes Next.js to render <script nonce="..."> tags,
  // which satisfies the nonce-based CSP (no 'unsafe-inline' needed).
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? ''

  return (
    <html lang="en" className={theme} suppressHydrationWarning>
      <head>
        {/* Resolve theme (cookie ?? OS preference) before paint to avoid a
            light/dark flash. A raw nonce'd inline <script> in <head> runs
            synchronously during HTML parsing (before first paint); the nonce
            satisfies the strict CSP without needing 'unsafe-inline'.
            suppressHydrationWarning: browsers strip the nonce attribute from the
            DOM after applying CSP, so React would otherwise flag a (benign)
            server/client nonce mismatch on this element during hydration. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=(dark|light)/);var t=m?m[1]:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
        {/* Load the GA library — nonce authorises this script tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HD03HER1E2"
          strategy="afterInteractive"
          nonce={nonce}
        />
        {/* GA init is in /public/analytics.js — no inline code, no 'unsafe-inline' needed */}
        <Script
          src="/analytics.js"
          strategy="afterInteractive"
          nonce={nonce}
        />
      </head>
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
