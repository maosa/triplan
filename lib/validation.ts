// Shared password policy, enforced wherever a user sets or changes a password
// (sign-up reset flow and the account security form). Returns an error message
// to surface to the user, or null when the password satisfies every rule.
export function validatePassword(password: string): string | null {
    if (password.length < 12) return 'Password must be at least 12 characters.'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
    return null
}
