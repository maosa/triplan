"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// If a tab has been hidden at least this long, treat the page as potentially
// stale on return and refresh. Short tab switches stay untouched so the app
// doesn't flicker every time you glance away.
const STALE_AFTER_MS = 60_000

/**
 * Wakes a stale tab when the user returns to it. Mounted once in the protected
 * layout so it applies to every page, not just one.
 *
 * On iOS especially, a backgrounded tab is either discarded (a fresh load on
 * return — already healthy) or frozen and restored from the back/forward cache
 * (BFCache) with its old in-memory state AND a possibly-expired Supabase
 * session. Because a BFCache restore makes no network request, middleware never
 * refreshes the session and server components never re-run — so the user lands
 * on stale data and background saves fail with "Load failed".
 *
 * router.refresh() re-runs the server components (fresh data) and hits
 * middleware (fresh session cookie) without a full reload, keeping client state
 * intact. If the session has expired, the protected pages redirect to /login,
 * which the router follows.
 */
export function TabResumeRefresh() {
  const router = useRouter()
  const hiddenAt = useRef<number | null>(null)
  // Set when a refresh was wanted but the device was offline; retried on reconnect.
  const pendingRefresh = useRef(false)

  useEffect(() => {
    const refresh = () => {
      if (navigator.onLine === false) {
        pendingRefresh.current = true
        return
      }
      pendingRefresh.current = false
      router.refresh()
    }

    // BFCache restore: the page comes back frozen in time — always refresh.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh()
    }

    // Covers tabs that stay alive in memory (no BFCache, no discard) but have
    // been hidden long enough that their data/session may be stale.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now()
        return
      }
      const since = hiddenAt.current
      hiddenAt.current = null
      if (since !== null && Date.now() - since >= STALE_AFTER_MS) refresh()
    }

    // If we wanted to refresh while offline, do it as soon as we reconnect.
    const onOnline = () => {
      if (pendingRefresh.current) refresh()
    }

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('online', onOnline)
    }
  }, [router])

  return null
}
