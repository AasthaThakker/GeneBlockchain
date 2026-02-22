"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAuth } from "@/lib/auth-context"
import type { AuditEvent } from "@/lib/types"

export default function LabAudit() {
  const { walletAddress } = useAuth()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    fetch(`/api/audit-events?actorRole=Lab`)
      .then(r => r.json())
      .then(data => setEvents(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress])

  if (loading) {
    return (
      <DashboardShell role="lab">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading audit logs...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="lab">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-muted-foreground">On-chain record of all lab-related genomic data events</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">TX Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {events.map((event) => (
                <tr key={event.eventId} className="transition-colors hover:bg-secondary/30">
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4"><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{event.action}</span></td>
                  <td className="max-w-[300px] px-6 py-4 text-sm text-foreground">{event.details}</td>
                  <td className="px-6 py-4 font-mono text-sm text-foreground">{event.target}</td>
                  <td className="px-6 py-4 font-mono text-xs text-primary">{event.txHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  )
}
