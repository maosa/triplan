import * as React from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type MessageType = "success" | "error"

// Shared status colors used by both the inline <Alert> and the transient
// <Toast>: lighter fill, darker border, and text in the same dark shade as the
// border — adapted per theme.
export const messageVariant: Record<MessageType, string> = {
    success: "border-green-700 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/60 dark:text-green-400",
    error: "border-red-700 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950/60 dark:text-red-400",
}

// Persistent, in-context status message (used for auth feedback that must stay
// on screen). The transient bottom-right variant lives in toast.tsx.
export function Alert({
    type,
    children,
    className,
}: {
    type: MessageType
    children: React.ReactNode
    className?: string
}) {
    const Icon = type === "success" ? CheckCircle2 : AlertCircle
    return (
        <div
            role={type === "error" ? "alert" : "status"}
            className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-sm font-medium",
                messageVariant[type],
                className
            )}
        >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{children}</span>
        </div>
    )
}
