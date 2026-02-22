"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Consent } from "@/lib/types"
import { ShieldOff } from "lucide-react"

export default function PatientConsents() {
  const { walletAddress, pid } = useAuth()
  const [consents, setConsents] = useState<Consent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const patientPid = pid || `PID-${walletAddress.slice(2, 8)}`
    fetch(`/api/consents?pid=${patientPid}`)
      .then(r => r.json())
      .then(data => setConsents(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, pid])

  const handleRevoke = async (consentId: string) => {
    const res = await fetch('/api/consents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentId, status: 'Revoked' }),
    })
    if (res.ok) {
      setConsents(prev => prev.map(c => c.consentId === consentId ? { ...c, status: 'Revoked' } : c))
    }
  }

  if (loading) {
    return (
      <DashboardShell role="patient">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading consents...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Active Consents</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your active data sharing consents. You can revoke access at any time.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {consents.map((consent) => {
          const startDate = new Date(consent.consentStart)
          const endDate = new Date(consent.consentEnd)
          const now = new Date()
          const totalDuration = endDate.getTime() - startDate.getTime()
          const elapsed = now.getTime() - startDate.getTime()
          const progress = consent.status === "Active" ? Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100) : consent.status === "Expired" ? 100 : 0

          return (
            <div key={consent.consentId} className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{consent.researcherName}</h3>
                    <StatusBadge status={consent.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{consent.institution}</p>
                </div>
                {consent.status === "Active" && (
                  <Button size="sm" variant="outline" onClick={() => handleRevoke(consent.consentId)} className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5">
                    <ShieldOff className="h-3.5 w-3.5" /> Revoke
                  </Button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Dataset</p>
                  <p className="font-mono text-sm font-medium text-primary">{consent.genomicRecordId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm text-foreground">{startDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="text-sm text-foreground">{endDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blockchain TX</p>
                  <p className="font-mono text-sm text-foreground">{consent.blockchainTxHash}</p>
                </div>
              </div>

              {consent.status === "Active" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Consent Duration</span>
                    <span>{Math.round(progress)}% elapsed</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </DashboardShell>
  )
}
