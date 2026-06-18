"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { importCsvData } from "@/app/actions"
import { Download, Upload } from "lucide-react"

export function CsvManager() {
    const [isPending, startTransition] = useTransition()
    const [fileName, setFileName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    // Clear the chosen file from both the display and the underlying input
    // (so the same file can be re-selected afterwards).
    const clearFile = () => {
        setFileName(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleImport = async (formData: FormData) => {
        startTransition(async () => {
            const result = await importCsvData(formData)
            if (result?.error) toast(result.error, 'error')
            else toast('Data imported successfully!', 'success')
            // Reset the picker once the attempt resolves (success or failure) so a
            // stale filename never lingers. Pure client state — no reload/flicker.
            clearFile()
        })
    }

    return (
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">

            {/* Export Section */}
            <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Export CSV</label>
                    <div className="flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm text-muted-foreground items-center">
                        Export your data as a single CSV file
                    </div>
                </div>
                <a href="/api/export" download>
                    <Button variant="primary" className="w-[100px]">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </a>
            </div>

            {/* Import Section */}
            <div className="pt-6 border-t border-border">
                <form action={handleImport} className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <label htmlFor="file" className="text-sm font-medium text-muted-foreground">Import CSV</label>
                        <div className="relative">
                            <Input
                                ref={fileInputRef}
                                id="file"
                                name="file"
                                type="file"
                                accept=".csv"
                                required
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setFileName(e.target.files[0].name)
                                    } else {
                                        setFileName(null)
                                    }
                                }}
                            />
                            <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm text-muted-foreground items-center pointer-events-none">
                                <span className="truncate">
                                    {fileName || "No file chosen"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button type="submit" isLoading={isPending} disabled={isPending} variant="primary" className="w-[100px]">
                        {!isPending && <Upload className="mr-2 h-4 w-4" />}
                        Import
                    </Button>
                </form>
            </div>
        </div>
    )
}
