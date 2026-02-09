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
        <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
                    <p className="text-sm text-gray-400">Export or import your training data (CSV).</p>
                </div>
                <a href="/api/export" download>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </a>
            </div>

            <div className="pt-4 border-t border-gray-800">
                <form action={handleImport} className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <label htmlFor="file" className="text-sm font-medium text-gray-300">Import CSV</label>
                        <Input id="file" name="file" type="file" accept=".csv" required className="cursor-pointer" />
                    </div>
                    <Button type="submit" isLoading={isPending} disabled={isPending}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                </form>
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
