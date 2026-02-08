import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TriPlan",
  description: "Race-centric triathlon training planning and tracking",
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
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
