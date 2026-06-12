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
  // Read theme from cookie — no DB query needed on every navigation
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value || 'dark'

  // Read the per-request nonce injected by middleware.ts.
  // Passing it to <Script> causes Next.js to render <script nonce="..."> tags,
  // which satisfies the nonce-based CSP (no 'unsafe-inline' needed).
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? ''

  return (
    <html lang="en" className={theme}>
      <head>
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
