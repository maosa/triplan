import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <div className="w-full max-w-md space-y-8 px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Reset Password</h1>
                    <p className="mt-2 text-sm text-gray-400">Enter your email to receive a reset link</p>
                </div>

                <form className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                    </div>

                    <Button type="submit" className="w-full" disabled>
                        Send Reset Link (Not Implemented)
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                        Note: Password reset functionality requires SMTP setup in Supabase.
                    </p>
                </form>

                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-white hover:text-gray-300">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    )
}
