import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/app/footer";
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
  let theme = 'dark'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('theme').eq('id', user.id).single()
      if (profile?.theme) {
        theme = profile.theme
      }
    }
  } catch (e) {
    // Ignore auth errors on layout if any
  }

  return (
    <html lang="en" className={theme}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HD03HER1E2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-HD03HER1E2');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
