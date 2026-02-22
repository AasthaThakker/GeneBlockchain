"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SearchableRecord } from "@/lib/types"
import { Search, Filter } from "lucide-react"

export default function ResearcherSearch() {
  const [query, setQuery] = useState("")
  const [allRecords, setAllRecords] = useState<SearchableRecord[]>([])
  const [results, setResults] = useState<SearchableRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/genomic-records')
      .then(r => r.json())
      .then(data => {
        const records: SearchableRecord[] = (data.data || []).map((r: Record<string, unknown>) => ({
          id: (r as { recordId: string }).recordId,
          pid: (r as { pid: string }).pid,
          fileType: (r as { fileType: string }).fileType,
          uploadDate: (r as { uploadDate: string }).uploadDate,
          status: (r as { status: string }).status,
          tags: (r as { tags: string[] }).tags || [],
        }))
        setAllRecords(records)
        setResults(records)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (!searchQuery.trim()) {
      setResults(allRecords)
      return
    }
    const lower = searchQuery.toLowerCase()
    setResults(
      allRecords.filter(
        (r) =>
          r.pid.toLowerCase().includes(lower) ||
          r.fileType.toLowerCase().includes(lower) ||
          r.tags.some((t) => t.toLowerCase().includes(lower))
      )
    )
  }

  if (loading) {
    return (
      <DashboardShell role="researcher">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading datasets...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="researcher">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Search Metadata</h1>
        <p className="mt-1 text-muted-foreground">
          Search de-identified genomic datasets by type, tags, or PID. No personal information is shown.
        </p>
      </div>

      <div className="mb-8 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by PID, file type, or tags (e.g., 'VCF', 'Oncology', 'South Asian')..."
            className="border-border bg-card pl-10 text-foreground"
          />
        </div>
        <Button variant="outline" className="gap-2 border-border text-foreground">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {results.length} dataset{results.length !== 1 ? "s" : ""} found
      </div>

      <div className="flex flex-col gap-4">
        {results.map((record) => (
          <div key={record.id} className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-primary">{record.id}</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{record.fileType}</span>
                  <StatusBadge status={record.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  PID: {record.pid} | Uploaded: {record.uploadDate}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => (window.location.href = `/researcher/request?dataset=${record.id}&pid=${record.pid}`)}
              >
                Request Access
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  )
}
