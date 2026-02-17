"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { importCsvData } from "@/app/actions"
import { Download, Upload, AlertCircle } from "lucide-react"

export function CsvManager() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)

    const handleImport = async (formData: FormData) => {
        setError(null)
        setSuccess(null)
        startTransition(async () => {
            const result = await importCsvData(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setSuccess('Data imported successfully!')
                // Optional: clear file input
            }
        })
    }

    return (
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">

            {/* Export Section */}
            <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-300">Export CSV</label>
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
            <div className="pt-6 border-t border-gray-800">
                <form action={handleImport} className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <label htmlFor="file" className="text-sm font-medium text-gray-300">Import CSV</label>
                        <div className="relative">
                            <Input
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
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                </form>
                {/* Status Messages */}
                {error && (
                    <div className="mt-2 flex items-center text-sm text-red-500">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mt-2 text-sm text-green-500">
                        {success}
                    </div>
                )}
            </div>
        </div>
    )
}
