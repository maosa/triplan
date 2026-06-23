// Only allow same-origin relative paths as redirect targets. Rejects absolute
// URLs (`http://evil.com`) and protocol-relative URLs (`//evil.com`) so a
// crafted `next` param can't turn an auth callback into an open redirect.
export function safeNext(next: string | null): string {
    if (!next || !next.startsWith('/') || next.startsWith('//')) return '/'
    return next
}
