import type { ErrorEvent } from '@sentry/nextjs'

// Messages browsers use when a fetch fails at the network layer — the
// connection dropped, the device went offline, or the request was aborted
// (e.g. a backgrounded mobile tab) — rather than because of an application bug.
// WebKit/iOS reports "Load failed"; Chromium reports "Failed to fetch".
const NETWORK_ABORT_MESSAGES = ['Load failed', 'Failed to fetch']

/**
 * Sentry `beforeSend` hook that drops benign, unactionable network-abort noise.
 *
 * These fire from mobile clients whose connection blips mid-request (commonly a
 * stale/backgrounded tab). They're always `handled`, never affect a user's data
 * — the app already reverts + warns on a failed save — and there's no code fix
 * for "the phone lost signal". Only *handled* network aborts are dropped; an
 * unhandled one could still be worth seeing, and a real server bug surfaces as a
 * different error or a returned error, so both still reach Sentry.
 */
export function dropBenignNetworkErrors(event: ErrorEvent): ErrorEvent | null {
  const values = event.exception?.values
  if (!values?.length) return event

  for (const ex of values) {
    const isNetworkAbort = ex.value != null && NETWORK_ABORT_MESSAGES.some((m) => ex.value!.includes(m))
    // mechanism.handled is undefined on some events; treat missing as handled.
    const handled = ex.mechanism?.handled !== false
    if (isNetworkAbort && handled) return null
  }

  return event
}
