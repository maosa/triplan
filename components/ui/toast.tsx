"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error"

interface ToastItem {
    id: number
    message: string
    type: ToastType
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
    const ctx = React.useContext(ToastContext)
    if (!ctx) throw new Error("useToast must be used within a ToastProvider")
    return ctx
}

// How long a toast stays before auto-dismissing.
const DURATION_MS = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<ToastItem[]>([])

    const dismiss = React.useCallback((id: number) => {
        setToasts((current) => current.filter((t) => t.id !== id))
    }, [])

    const toast = React.useCallback((message: string, type: ToastType = "success") => {
        const id = Date.now() + Math.random()
        setToasts((current) => [...current, { id, message, type }])
    }, [])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Bottom-right stack. Sits above the mobile bottom nav (bottom-20) and
                above modals (z-[100]). The container ignores pointer events so it
                never blocks the UI; individual toasts re-enable them. */}
            <div className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-4">
                {toasts.map((t) => (
                    <Toast key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
    React.useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), DURATION_MS)
        return () => clearTimeout(timer)
    }, [toast.id, onDismiss])

    // Lighter fill, darker border, and text in the same dark shade as the border.
    const variant =
        toast.type === "success"
            ? "border-green-700 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/60 dark:text-green-400"
            : "border-red-700 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950/60 dark:text-red-400"

    const Icon = toast.type === "success" ? CheckCircle2 : AlertCircle

    return (
        <div
            role={toast.type === "error" ? "alert" : "status"}
            className={cn(
                "pointer-events-auto flex items-start gap-2.5 rounded-lg border p-3 text-sm font-medium shadow-lg",
                "animate-in fade-in slide-in-from-bottom-2 duration-200",
                variant
            )}
        >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
