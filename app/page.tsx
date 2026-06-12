import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
