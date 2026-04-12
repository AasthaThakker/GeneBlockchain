"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
interface EncryptedFile {
  fileId: string
  fileName: string
  fileType: string
  fileHash: string
  pid: string
  labId: string
  labName: string
  uploadDate: string
  blockchainTxHash?: string
  onChainRecordIndex?: number
  status: string
  tags: string[]
  fileSize: number
  patientAge?: number
  patientGender?: 'Male' | 'Female' | 'Other'
  geographicRegion?: string
}

export default function PatientRecords() {
  const { walletAddress, pid } = useAuth()
  const [records, setRecords] = useState<EncryptedFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const patientPid = pid || `PID-${walletAddress.slice(2, 8)}`
    fetch(`/api/files?pid=${patientPid}`)
      .then(r => r.json())
      .then(data => setRecords(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, pid])

  if (loading) {
    return (
      <DashboardShell role="patient">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading records...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Genomic Records</h1>
        <p className="mt-1 text-muted-foreground">
          All genomic datasets linked to your de-identified Patient ID
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Lab</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {records.map((record) => (
                <tr key={record.fileId} className="transition-colors hover:bg-secondary/30">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{record.fileId}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{record.labName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{record.fileType}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(record.uploadDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{record.patientAge || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{record.patientGender || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{record.geographicRegion || 'N/A'}</td>
                  <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Details */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {records.map((record) => (
          <div key={record.fileId} className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold text-primary">{record.fileId}</h3>
              <StatusBadge status={record.status} />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">File Hash (SHA-256)</span>
                <span className="max-w-[280px] truncate font-mono text-xs text-foreground">{record.fileHash}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Blockchain TX</span>
                <span className="max-w-[280px] truncate font-mono text-xs text-primary">{record.blockchainTxHash}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">File ID</span>
                <span className="max-w-[280px] truncate font-mono text-xs text-foreground">{record.fileId}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <h4 className="text-xs font-semibold text-foreground mb-3">Patient Demographics</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Age</span>
                    <span className="text-xs text-foreground">{record.patientAge || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Gender</span>
                    <span className="text-xs text-foreground">{record.patientGender || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Geographic Region</span>
                    <span className="text-xs text-foreground">{record.geographicRegion || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  )
}
