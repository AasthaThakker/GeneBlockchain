"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
import type { AccessRequest, Consent, AuditEvent } from "@/lib/types"
import { Search, FileText, ShieldCheck, ScrollText } from "lucide-react"

export default function ResearcherDashboard() {
  const { walletAddress, researcherId } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [consents, setConsents] = useState<Consent[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const queryResearcherId = researcherId || walletAddress
    Promise.all([
      fetch(`/api/access-requests?researcherId=${queryResearcherId}`).then(r => r.json()),
      fetch(`/api/consents?researcherId=${queryResearcherId}`).then(r => r.json()),
      fetch(`/api/audit-events?actorRole=Researcher`).then(r => r.json()),
    ]).then(([reqData, conData, audData]) => {
      setRequests(reqData.data || [])
      setConsents(conData.data || [])
      setAuditEvents(audData.data || [])
    }).finally(() => setLoading(false))
  }, [walletAddress, researcherId])

  const pendingRequests = requests.filter(r => r.status === "Pending")
  const activeConsents = consents.filter(c => c.status === "Active")

  if (loading) {
    return (
      <DashboardShell role="researcher">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="researcher">
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Access Requests" value={requests.length} icon={Search} />
        <StatCard title="Pending" value={pendingRequests.length} icon={FileText} />
        <StatCard title="Active Permissions" value={activeConsents.length} icon={ShieldCheck} />
        <StatCard title="Audit Events" value={auditEvents.length} icon={ScrollText} />
      </div>

      {/* Recent Requests */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Access Requests</h2>
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Dataset</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {requests.slice(0, 5).map((r) => (
                <tr key={r.requestId} className="transition-colors hover:bg-secondary/30">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{r.genomicRecordId}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{r.purpose}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.durationDays} days</td>
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
