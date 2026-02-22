"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAuth } from "@/lib/auth-context"
import type { AuditEvent } from "@/lib/types"
import { FileText, ShieldCheck, Eye, UserPlus, AlertTriangle, KeyRound } from "lucide-react"

const actionIcons: Record<string, typeof FileText> = {
  GenomicDataRegistered: FileText,
  ConsentGranted: ShieldCheck,
  DataAccessed: Eye,
  PatientRegistered: UserPlus,
  AccessRequested: KeyRound,
  ConsentRevoked: AlertTriangle,
}

const actionColors: Record<string, string> = {
  GenomicDataRegistered: "bg-primary/10 text-primary",
  ConsentGranted: "bg-success/10 text-success",
  DataAccessed: "bg-chart-2/10 text-chart-2",
  PatientRegistered: "bg-chart-3/10 text-chart-3",
  AccessRequested: "bg-warning/10 text-warning",
  ConsentRevoked: "bg-destructive/10 text-destructive",
}

export default function PatientAudit() {
  const { walletAddress, pid } = useAuth()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const patientPid = pid || `PID-${walletAddress.slice(2, 8)}`
    fetch(`/api/audit-events?pid=${patientPid}`)
      .then(r => r.json())
      .then(data => setEvents(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, pid])

  if (loading) {
    return (
      <DashboardShell role="patient">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading audit logs...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-muted-foreground">
          Immutable on-chain record of all events related to your genomic data
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 h-full w-px bg-border/50" />
        <div className="flex flex-col gap-6">
          {events.map((event) => {
            const Icon = actionIcons[event.action] || FileText
            const colorClass = actionColors[event.action] || "bg-muted text-muted-foreground"
            return (
              <div key={event.eventId} className="relative flex gap-4 pl-12">
                <div className={`absolute left-3 top-1 flex h-7 w-7 items-center justify-center rounded-full ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 rounded-xl border border-border/50 bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{event.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{event.details}</p>
                    </div>
                    <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{event.actorRole}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div><span className="text-xs text-muted-foreground">TX Hash: </span><span className="font-mono text-xs text-primary">{event.txHash}</span></div>
                    <div><span className="text-xs text-muted-foreground">Actor: </span><span className="font-mono text-xs text-foreground">{event.actor}</span></div>
                    <div><span className="text-xs text-muted-foreground">Time: </span><span className="text-xs text-foreground">{new Date(event.timestamp).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
