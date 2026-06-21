import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/landing-page'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Logged-out visitors get the public marketing landing page.
  if (!user) {
    return <LandingPage />
  }

  // Logged-in users are sent straight into the app at their preferred page.
  const { data: profile } = await supabase
    .from('profiles')
    .select('landing_page')
    .eq('id', user.id)
    .single()

  const landingPage = profile?.landing_page
  if (landingPage === 'maintenance') {
    redirect('/maintenance')
  } else if (landingPage === 'results') {
    redirect('/results')
  } else {
    redirect('/races')
  }
}
