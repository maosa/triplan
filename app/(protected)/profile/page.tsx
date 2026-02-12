import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile, deleteAccount } from '@/app/actions'
import { Header } from '@/components/app/header'
import Link from 'next/link'
import { ArrowLeft, User, LogOut } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { ProfileForm } from '@/components/app/profile-form'

export default async function ProfilePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const handleDeleteAccount = async () => {
        "use server"
        await deleteAccount(new FormData())
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
                            TriPlan
                        </Link>

                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-3">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Races
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Optional: Highlight we are on Account or disable link? 
                            User asked for "Log Out button... Account button...". 
                            I'll render them standard. */}
                        <Link href="/profile">
                            <Button variant="ghost" size="sm" className="text-foreground bg-accent/50">
                                <User className="mr-2 h-4 w-4" />
                                Account
                            </Button>
                        </Link>
                        <form action={logout} className="flex m-0 p-0">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Log out">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="container max-w-2xl mx-auto px-4 py-8 sm:px-8 space-y-8">
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
                    <h2 className="text-xl font-semibold text-foreground">Security</h2>
                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            To change your email or password, please use the update form below.
                            Note: Changing email may require confirmation.
                        </p>
                        {/* 
                    Ideally separate forms for Email and Password. 
                    For MVP, let's standard Next.js form action.
                    I haven't implemented updateUserAuth yet in actions.ts, 
                    I'll add it or simple logic here. 
                */}
                        <form action={async (formData) => {
                            "use server"
                            const email = formData.get('email') as string
                            const password = formData.get('password') as string
                            const supabase = await createClient()

                            const updates: any = {}
                            if (email && email !== user.email) updates.email = email
                            if (password) updates.password = password

                            if (Object.keys(updates).length > 0) {
                                const { error } = await supabase.auth.updateUser(updates)
                                if (error) {
                                    console.error(error)
                                    // Ideally show error toast
                                } else {
                                    // Success
                                }
                            }
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={user.email} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input id="password" name="password" type="password" placeholder="Leave blank to keep current" />
                            </div>
                            <Button type="submit">Update Security Settings</Button>
                        </form>
                    </div>
                </div>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
                    <div className="rounded-lg border border-red-900/20 bg-red-950/10 p-6 space-y-4">
                        <p className="text-sm text-gray-400">
                            Deleting your account will permanently delete all your races and workouts. This cannot be undone.
                        </p>
                        <form action={async (formData) => {
                            "use server"
                            await deleteAccount(formData)
                        }}>
                            <Button variant="destructive" type="submit">Delete Account</Button>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    )
}
