"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SearchableRecord } from "@/lib/types"
import { Search, Filter } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ResearcherSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [allRecords, setAllRecords] = useState<SearchableRecord[]>([])
  const [results, setResults] = useState<SearchableRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/files')
      .then(r => r.json())
      .then(data => {
        const records: SearchableRecord[] = (data.data || []).map((r: Record<string, unknown>) => ({
          id: (r as { fileId: string }).fileId,
          pid: (r as { pid: string }).pid,
          fileType: (r as { fileType: string }).fileType,
          uploadDate: (r as { uploadDate: string }).uploadDate,
          status: (r as { status: string }).status,
          tags: (r as { tags: string[] }).tags || [],
          patientInfo: (r as { patientInfo?: Record<string, unknown> }).patientInfo || {},
        }))
        setAllRecords(records)
        setResults(records)
      })
      .catch(console.error)
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
          r.tags.some((t) => t.toLowerCase().includes(lower)) ||
          (r.patientInfo?.age?.toString().includes(lower)) ||
          (r.patientInfo?.gender?.toLowerCase().includes(lower)) ||
          (r.patientInfo?.geographicRegion?.toLowerCase().includes(lower)) ||
          (r.patientInfo?.chronicDiseases?.toLowerCase().includes(lower)) ||
          (r.patientInfo?.medications?.toLowerCase().includes(lower)) ||
          (r.patientInfo?.familyHistory?.toLowerCase().includes(lower))
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
        <h1 className="text-2xl font-bold text-foreground">Search Genomic Datasets</h1>
        <p className="mt-1 text-muted-foreground">
          Search genomic datasets by PID, file type, tags, or demographic information. Patient demographic data helps researchers make informed access requests.
        </p>
      </div>

      <div className="mb-8 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by PID, file type, tags, age, gender, region, diseases (e.g., 'VCF', 'Oncology', 'South Asian', '45')..."
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
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-primary">{record.id}</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{record.fileType}</span>
                  <StatusBadge status={record.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  PID: {record.pid} | Uploaded: {record.uploadDate}
                </p>
                
                {/* Patient Demographic Information */}
                {record.patientInfo && Object.keys(record.patientInfo).length > 0 && (
                  <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Patient Demographics</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <span className="ml-2 font-medium text-foreground">{record.patientInfo.age || 'NA'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="ml-2 font-medium text-foreground">{record.patientInfo.gender || 'NA'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Region:</span>
                        <span className="ml-2 font-medium text-foreground">{record.patientInfo.geographicRegion || 'NA'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Chronic Diseases:</span>
                        <span className="ml-2 font-medium text-foreground">{record.patientInfo.chronicDiseases || 'NA'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Medications:</span>
                        <span className="ml-2 font-medium text-foreground">{record.patientInfo.medications || 'NA'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Family History:</span>
                        <span className="ml-2 font-medium text-foreground">{record.patientInfo.familyHistory || 'NA'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 ml-4"
                onClick={() => router.push(`/researcher/requests?dataset=${record.id}&pid=${record.pid}`)}
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
