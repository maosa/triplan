"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    size?: 'default' | 'lg'
    footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children, size = 'default', footer }: ModalProps) {
    React.useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    // Lock background page scroll while the modal is open. We pin the body with
    // `position: fixed` (not just `overflow: hidden`) because iOS Safari ignores
    // overflow:hidden when the on-screen keyboard opens and scrolls the document
    // to reveal a focused input — leaving the page shifted after close. Capturing
    // the scroll position and restoring it on close keeps the user exactly where
    // they opened the modal (e.g. the top of the page).
    React.useEffect(() => {
        if (!isOpen) return
        const scrollY = window.scrollY
        const body = document.body
        const prev = {
            position: body.style.position,
            top: body.style.top,
            left: body.style.left,
            right: body.style.right,
            width: body.style.width,
            overflow: body.style.overflow,
        }
        body.style.position = "fixed"
        body.style.top = `-${scrollY}px`
        body.style.left = "0"
        body.style.right = "0"
        body.style.width = "100%"
        body.style.overflow = "hidden"
        return () => {
            body.style.position = prev.position
            body.style.top = prev.top
            body.style.left = prev.left
            body.style.right = prev.right
            body.style.width = prev.width
            body.style.overflow = prev.overflow
            window.scrollTo(0, scrollY)
        }
    }, [isOpen])

    if (!isOpen) return null

    const closeButton = (
        <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
            <X className="h-5 w-5" />
        </button>
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="fixed inset-0" onClick={onClose}></div>
            {footer !== undefined ? (
                <div className={cn(
                    "relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg",
                    size === 'lg' ? "max-w-2xl" : "max-w-lg"
                )}>
                    <div className="flex items-center justify-between shrink-0 border-b border-border px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
                        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                        {closeButton}
                    </div>
                    <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 sm:px-8">
                        {children}
                    </div>
                    <div className="shrink-0 border-t border-border px-6 py-4 sm:px-8">
                        {footer}
                    </div>
                </div>
            ) : (
                <div className={cn(
                    "relative flex max-h-[85vh] w-full flex-col rounded-lg border border-border bg-background p-6 shadow-lg sm:p-8",
                    size === 'lg' ? "max-w-2xl" : "max-w-lg"
                )}>
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                        {closeButton}
                    </div>
                    {children}
                </div>
            )}
        </div>
    )
}
