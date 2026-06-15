// Minimum password length, kept in sync with the Supabase Auth setting
// (Authentication → Providers → Email → Minimum password length).
export const MIN_PASSWORD_LENGTH = 8

// Shared password policy, enforced wherever a user creates or changes a password
// (sign-up, the reset-password flow, and the account security form). Returns an
// error message to surface to the user, or null when the password is valid.
export function validatePassword(password: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    return null
}
