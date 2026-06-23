"use client"

import { useTransition } from "react"
import { useToast } from "@/components/ui/toast"

type ActionResult = { error?: string; success?: boolean | string } | void

interface RunOptions {
    /** Runs after a successful action (e.g. close the modal, reset a field). */
    onSuccess?: () => void
    /** Runs after a failed action, in addition to the error toast. */
    onError?: () => void
    /** Shown as a success toast when the action succeeds. */
    successMessage?: string
}

/**
 * Standardizes the "run a server action inside a transition, toast the error,
 * then run a callback" pattern shared by the app's forms and modals.
 *
 * Returns `toast` too, for the occasional direct toast (e.g. client-side
 * validation before the action runs).
 */
export function useFormAction() {
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()

    const run = (action: () => Promise<ActionResult>, opts: RunOptions = {}) => {
        startTransition(async () => {
            const result = await action()
            if (result?.error) {
                toast(result.error, 'error')
                opts.onError?.()
                return
            }
            if (opts.successMessage) toast(opts.successMessage, 'success')
            opts.onSuccess?.()
        })
    }

    return { isPending, run, toast }
}
