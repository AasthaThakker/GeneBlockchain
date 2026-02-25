"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Consent } from "@/lib/types"
import { ShieldOff, ShieldCheck, History, Activity, ShieldAlert } from "lucide-react"

export default function PatientConsents() {
  const { walletAddress, pid } = useAuth()
  const [consents, setConsents] = useState<Consent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    // Consistently use lowercase wallet for PID calculation to match database seeding
    const patientPid = pid || `PID-${walletAddress.toLowerCase().slice(2, 8)}`
    setLoading(true)
    fetch(`/api/consents?pid=${patientPid}`)
      .then(r => r.json())
      .then(data => setConsents(data.data || []))
      .catch(err => console.error("Failed to fetch consents:", err))
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

  const active = consents.filter(c => c.status === 'Active')
  const history = consents.filter(c => c.status !== 'Active')

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
        <h1 className="text-3xl font-black text-foreground tracking-tight">Data <span className="text-primary">Consents</span></h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Complete control over your genomic data. Review which researchers currently have active access and your past sharing history.
        </p>
      </div>

      <div className="space-y-12">
        {/* Active Consents Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground/70">Active Access</h2>
            <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold flex items-center justify-center border border-emerald-500/20">
              {active.length}
            </span>
          </div>

          {active.length > 0 ? (
            <div className="grid gap-4">
              {active.map((consent) => {
                const startDate = new Date(consent.consentStart)
                const endDate = new Date(consent.consentEnd)
                const now = new Date()
                const totalDuration = endDate.getTime() - startDate.getTime()
                const elapsed = now.getTime() - startDate.getTime()
                const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)

                return (
                  <div key={consent.consentId} className="group rounded-2xl border border-emerald-500/20 bg-card p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-black text-foreground text-lg tracking-tight">{consent.researcherName}</h3>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{consent.institution}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(consent.consentId)}
                        className="rounded-xl px-5 font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 h-10 gap-2"
                      >
                        <ShieldOff className="h-4 w-4" /> Revoke Access
                      </Button>
                    </div>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-border/50 p-4 bg-background/50">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Dataset</p>
                        <p className="text-sm font-mono font-bold text-primary">{consent.genomicRecordId}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 p-4 bg-background/50">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Expiration</p>
                        <p className="text-sm font-bold text-foreground">{endDate.toLocaleDateString()}</p>
                      </div>
                      <div className="md:col-span-2 rounded-xl border border-border/50 p-4 bg-background/50">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">
                          <span>Access Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/60">
              <div className="h-16 w-16 bg-background rounded-2xl flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                <ShieldCheck className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Privacy Maximized</h3>
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                You have no active data sharing consents. Your genomic data is locked and private.
              </p>
            </div>
          )}
        </section>

        {/* Consent History Section */}
        {history.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground/70 mb-6">Archive & History</h2>
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Researcher</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Period</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {history.map((consent) => (
                    <tr key={consent.consentId} className="group hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-foreground">{consent.researcherName || "Unknown"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">{consent.consentId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={consent.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] text-muted-foreground">0x...{consent.blockchainTxHash?.slice(-8)}</span>
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
