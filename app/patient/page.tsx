"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
import type { GenomicRecord, AccessRequest, Consent, AuditEvent } from "@/lib/types"
import { FileText, Clock, ShieldCheck, ScrollText } from "lucide-react"

export default function PatientDashboard() {
  const { walletAddress, pid } = useAuth()
  const [records, setRecords] = useState<GenomicRecord[]>([])
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [consents, setConsents] = useState<Consent[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const patientPid = pid || `PID-${walletAddress.slice(2, 8)}`

    Promise.all([
      fetch(`/api/genomic-records?pid=${patientPid}`).then(r => r.json()),
      fetch(`/api/access-requests?pid=${patientPid}`).then(r => r.json()),
      fetch(`/api/consents?pid=${patientPid}`).then(r => r.json()),
      fetch(`/api/audit-events?pid=${patientPid}`).then(r => r.json()),
    ]).then(([recData, reqData, conData, audData]) => {
      setRecords(recData.data || [])
      setRequests(reqData.data || [])
      setConsents(conData.data || [])
      setAuditEvents(audData.data || [])
    }).finally(() => setLoading(false))
  }, [walletAddress, pid])

  const pendingRequests = requests.filter((r) => r.status === "Pending")
  const activeConsents = consents.filter((c) => c.status === "Active")

  if (loading) {
    return (
      <DashboardShell role="patient">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Genomic Records" value={records.length} icon={FileText} />
        <StatCard title="Pending Requests" value={pendingRequests.length} icon={Clock} />
        <StatCard title="Active Consents" value={activeConsents.length} icon={ShieldCheck} />
        <StatCard title="Audit Events" value={auditEvents.length} icon={ScrollText} />
      </div>

      {/* Recent Records */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Records</h2>
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Record ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Lab</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {records.slice(0, 5).map((r) => (
                <tr key={r.recordId} className="transition-colors hover:bg-secondary/30">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{r.recordId}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{r.labName}</td>
                  <td className="px-6 py-4"><span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{r.fileType}</span></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(r.uploadDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Pending Request{pendingRequests.length > 1 ? 's' : ''}</h2>
          <div className="flex flex-col gap-3">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.requestId} className="rounded-xl border border-warning/30 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{req.researcherName}</p>
                    <p className="text-sm text-muted-foreground">{req.institution} · {req.purpose}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Audit */}
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
