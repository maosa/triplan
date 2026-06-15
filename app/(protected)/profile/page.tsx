import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/app/header'
import { ProfileForm } from '@/components/app/profile-form'
import { MaintenanceDefaultsForm } from '@/components/app/maintenance-defaults-form'
import { CsvManager } from '@/components/app/csv-manager'
import { SecurityForm } from '@/components/app/security-form'
import { DeleteAccountSection } from '@/components/app/delete-account-section'

export default async function ProfilePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('units, theme, landing_page, maintenance_defaults')
        .eq('id', user.id)
        .single()

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="container mx-auto px-4 py-8 sm:px-8 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your profile, preferences, and account settings.
                    </p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
                    <ProfileForm profile={profile} />
                </div>

                <div className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-foreground">Maintenance Training</h2>
                        <p className="text-sm text-muted-foreground">
                            Set your default weekly schedule. Apply it to any week from the Maintenance page.
                        </p>
                    </div>
                    <MaintenanceDefaultsForm initialDefaults={profile?.maintenance_defaults ?? {}} />
                </div>

                <div className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-foreground">Data Management</h2>
                        <p className="text-sm text-muted-foreground">
                            Export or import your training data (CSV).
                        </p>
                    </div>
                    <CsvManager />
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground">Security</h2>
                    <SecurityForm currentEmail={user.email || ''} />
                </div>

                <DeleteAccountSection />
            </main>
        </div>
    )
}
