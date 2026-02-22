"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
import type { GenomicRecord } from "@/lib/types"

export default function LabRecords() {
  const { walletAddress, labId } = useAuth()
  const [records, setRecords] = useState<GenomicRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const queryLabId = labId || walletAddress
    fetch(`/api/genomic-records?labId=${queryLabId}`)
      .then(r => r.json())
      .then(data => setRecords(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, labId])

  if (loading) {
    return (
      <DashboardShell role="lab">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading records...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="lab">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Registered Records</h1>
        <p className="mt-1 text-muted-foreground">All genomic data files uploaded and registered by this laboratory</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Record ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient PID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File Hash</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">TX Hash</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {records.map((record) => (
                <tr key={record.recordId} className="transition-colors hover:bg-secondary/30">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{record.recordId}</td>
                  <td className="px-6 py-4 font-mono text-sm text-foreground">{record.pid}</td>
                  <td className="px-6 py-4"><span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{record.fileType}</span></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(record.uploadDate).toLocaleDateString()}</td>
                  <td className="max-w-[150px] truncate px-6 py-4 font-mono text-xs text-muted-foreground">{record.fileHash}</td>
                  <td className="max-w-[150px] truncate px-6 py-4 font-mono text-xs text-primary">{record.blockchainTxHash}</td>
                  <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  )
}
