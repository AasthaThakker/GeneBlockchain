"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { AccessRequest } from "@/lib/types"
import { CheckCircle2, XCircle, Activity } from "lucide-react"

export default function PatientRequests() {
  const { walletAddress, pid } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    // Consistently use lowercase wallet for PID calculation
    const patientPid = pid || `PID-${walletAddress.toLowerCase().slice(2, 8)}`
    setLoading(true)
    fetch(`/api/access-requests?pid=${patientPid}`)
      .then(r => r.json())
      .then(data => setRequests(data.data || []))
      .catch(err => console.error("Failed to fetch requests:", err))
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
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-pulse">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-semibold tracking-wide uppercase text-xs">Syncing with registry...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Access <span className="text-primary">Requests</span></h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Review and manage researcher requests to access your data. Only approve requests from trusted institutions.
        </p>
      </div>

      <div className="space-y-12">
        {/* Pending Requests Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground/70">Pending Approval</h2>
            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center border border-primary/20">
              {pending.length}
            </span>
          </div>

          {pending.length > 0 ? (
            <div className="grid gap-4">
              {pending.map((req) => (
                <div key={req.requestId} className="group rounded-2xl border border-warning/20 bg-card p-6 shadow-sm hover:shadow-xl hover:shadow-warning/5 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                        <Activity className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-lg tracking-tight">{req.researcherName}</h3>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{req.institution}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(req.requestId, "Approved")}
                        className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-5 font-bold shadow-lg shadow-emerald-500/20 gap-2 h-10"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve Access
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(req.requestId, "Rejected")}
                        className="rounded-xl px-5 font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 h-10 gap-2"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 rounded-xl bg-secondary/30 p-4 border border-border/50">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Research Purpose</p>
                      <p className="text-sm font-medium text-foreground leading-relaxed">{req.purpose}</p>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border/50 p-4 bg-background/50">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Duration</p>
                        <p className="text-sm font-bold text-foreground">{req.durationDays} Days</p>
                      </div>
                      <div className="rounded-xl border border-border/50 p-4 bg-background/50">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Dataset ID</p>
                        <p className="text-sm font-mono font-bold text-primary">{req.genomicRecordId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/60">
              <div className="h-16 w-16 bg-background rounded-2xl flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                <CheckCircle2 className="h-8 w-8 text-success/40" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Inbox Zero</h3>
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                All researcher requests have been resolved. Your genomic data access is fully controlled.
              </p>
            </div>
          )}
        </section>

        {/* Resolved Requests Section */}
        {resolved.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground/70 mb-6">Request History</h2>
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Researcher</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dataset</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Purpose</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {resolved.map((req) => (
                    <tr key={req.requestId} className="group hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{req.researcherName}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{req.institution}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-primary">{req.genomicRecordId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{req.purpose}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  )
}
