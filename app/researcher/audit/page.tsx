"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import type { AuditEvent } from "@/lib/types"
import {
  FileText,
  Shield,
  Download,
  Upload,
  Search,
  CheckCircle,
  UserPlus,
} from "lucide-react"
import React from "react"

const iconMap: Record<string, React.ElementType> = {
  DataAccessed: Download,
  AccessRequested: Search,
  ConsentGranted: CheckCircle,
  ConsentRevoked: Shield,
  GenomicDataRegistered: Upload,
  PatientRegistered: UserPlus,
}

export default function ResearcherAuditPage() {
  const { walletAddress } = useAuth()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    fetch(`/api/audit-events?actorRole=Researcher`)
      .then(r => r.json())
      .then(data => setEvents(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress])

  if (loading) {
    return (
      <DashboardShell role="researcher" title="Audit History">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading audit logs...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="researcher" title="Audit History">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Blockchain Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => {
              const Icon = iconMap[event.action] || FileText
              return (
                <div key={event.eventId} className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{event.action.replace(/([A-Z])/g, " $1").trim()}</p>
                      <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.details}</p>
                    <p className="mt-1 font-mono text-xs text-primary/70">TX: {event.txHash}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
