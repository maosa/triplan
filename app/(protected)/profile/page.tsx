import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile, deleteAccount } from '@/app/actions'
import { Header } from '@/components/app/header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
                <div className="container flex h-16 items-center px-4 sm:px-8">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Races
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:px-8 max-w-2xl space-y-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Account Settings</h1>
                    <p className="text-gray-400">Manage your preferences and account details.</p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">Preferences</h2>
                    <ProfileForm profile={profile} />
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">Security</h2>
                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 space-y-4">
                        <p className="text-sm text-gray-400">
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
                </section>

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
