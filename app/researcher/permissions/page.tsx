"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
import type { Consent } from "@/lib/types"
import { Download, Shield, AlertTriangle } from "lucide-react"

export default function ResearcherPermissionsPage() {
  const { walletAddress, researcherId } = useAuth()
  const [consents, setConsents] = useState<Consent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const queryResearcherId = researcherId || walletAddress
    fetch(`/api/consents?researcherId=${queryResearcherId}`)
      .then(r => r.json())
      .then(data => setConsents(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, researcherId])

  const activeConsents = consents.filter(c => c.status === "Active")
  const expiredConsents = consents.filter(c => c.status === "Expired" || c.status === "Revoked")

  if (loading) {
    return (
      <DashboardShell role="researcher" title="Active Permissions">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading permissions...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="researcher" title="Active Permissions">
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-foreground">Active Consents ({activeConsents.length})</h3>
          <div className="space-y-3">
            {activeConsents.map((consent) => (
              <Card key={consent.consentId} className="border-border bg-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Dataset: {consent.genomicRecordId}</p>
                      <p className="text-sm text-muted-foreground">
                        Granted by: {consent.pid} | Expires: {new Date(consent.consentEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status="Active" />
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Download className="mr-1 h-3 w-3" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activeConsents.length === 0 && (
              <Card className="border-border bg-card">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No active permissions.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-foreground">Expired / Revoked ({expiredConsents.length})</h3>
          <div className="space-y-3">
            {expiredConsents.map((consent) => (
              <Card key={consent.consentId} className="border-border bg-card opacity-60">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Dataset: {consent.genomicRecordId}</p>
                      <p className="text-sm text-muted-foreground">Expired: {new Date(consent.consentEnd).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StatusBadge status={consent.status} />
                </CardContent>
              </Card>
            ))}
            {expiredConsents.length === 0 && (
              <Card className="border-border bg-card">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No expired permissions.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
