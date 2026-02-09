"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/components/ui/button"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="fixed inset-0" onClick={onClose}></div>
            <div className="relative w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg sm:p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
