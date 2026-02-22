"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
import type { GenomicRecord, AuditEvent } from "@/lib/types"
import { FileText, Upload, CheckCircle2, ScrollText } from "lucide-react"

export default function LabDashboard() {
  const { walletAddress, labId } = useAuth()
  const [records, setRecords] = useState<GenomicRecord[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const queryLabId = labId || walletAddress
    Promise.all([
      fetch(`/api/genomic-records?labId=${queryLabId}`).then(r => r.json()),
      fetch(`/api/audit-events?actorRole=Lab`).then(r => r.json()),
    ]).then(([recData, audData]) => {
      setRecords(recData.data || [])
      setAuditEvents(audData.data || [])
    }).finally(() => setLoading(false))
  }, [walletAddress, labId])

  const verifiedRecords = records.filter(r => r.status === "Verified")

  if (loading) {
    return (
      <DashboardShell role="lab">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="lab">
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Records" value={records.length} icon={FileText} />
        <StatCard title="Uploads" value={records.length} icon={Upload} />
        <StatCard title="Verified" value={verifiedRecords.length} icon={CheckCircle2} />
        <StatCard title="Audit Events" value={auditEvents.length} icon={ScrollText} />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Uploads</h2>
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Record ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient PID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {records.slice(0, 5).map((r) => (
                <tr key={r.recordId} className="transition-colors hover:bg-secondary/30">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{r.recordId}</td>
                  <td className="px-6 py-4 font-mono text-sm text-foreground">{r.pid}</td>
                  <td className="px-6 py-4"><span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{r.fileType}</span></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(r.uploadDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {auditEvents.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h2>
          <div className="flex flex-col gap-2">
            {auditEvents.slice(0, 5).map((e) => (
              <div key={e.eventId} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">{e.action}</p>
                  <p className="text-xs text-muted-foreground">{e.details}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
