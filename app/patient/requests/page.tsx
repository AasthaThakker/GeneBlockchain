"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { AccessRequest } from "@/lib/types"
import { CheckCircle2, XCircle } from "lucide-react"

export default function PatientRequests() {
  const { walletAddress, pid } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const patientPid = pid || `PID-${walletAddress.slice(2, 8)}`
    fetch(`/api/access-requests?pid=${patientPid}`)
      .then(r => r.json())
      .then(data => setRequests(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, pid])

  const handleAction = async (requestId: string, status: "Approved" | "Rejected") => {
    const res = await fetch('/api/access-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status }),
    })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status } : r))
    }
  }

  const pending = requests.filter((r) => r.status === "Pending")
  const resolved = requests.filter((r) => r.status !== "Pending")

  if (loading) {
    return (
      <DashboardShell role="patient">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading requests...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Pending Access Requests</h1>
        <p className="mt-1 text-muted-foreground">
          Review and manage researcher access requests to your genomic data
        </p>
      </div>

      {pending.length > 0 ? (
        <div className="mb-8 flex flex-col gap-4">
          {pending.map((req) => (
            <div key={req.requestId} className="rounded-xl border border-warning/30 bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{req.researcherName}</h3>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{req.institution}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(req.requestId, "Approved")} className="bg-success text-success-foreground hover:bg-success/90 gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(req.requestId, "Rejected")} className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-secondary/50 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Research Purpose</p>
                <p className="mt-1 text-sm text-foreground">{req.purpose}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium text-foreground">{req.durationDays} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dataset</p>
                  <p className="font-mono text-sm font-medium text-primary">{req.genomicRecordId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">On-Chain Request</p>
                  <p className="font-mono text-sm text-foreground">{req.blockchainRequestId}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-border/50 bg-card py-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success/50" />
          <p className="mt-3 text-sm text-muted-foreground">No pending requests at this time</p>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Resolved Requests</h2>
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Researcher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Institution</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Dataset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {resolved.map((req) => (
                  <tr key={req.requestId} className="transition-colors hover:bg-secondary/30">
                    <td className="px-6 py-4 text-sm text-foreground">{req.researcherName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{req.institution}</td>
                    <td className="px-6 py-4 font-mono text-sm text-primary">{req.genomicRecordId}</td>
                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
