"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/lib/auth-context"
import type { AccessRequest } from "@/lib/types"
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"

export default function ResearcherRequestsPage() {
  const { walletAddress, researcherId } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const queryResearcherId = researcherId || walletAddress
    fetch(`/api/access-requests?researcherId=${queryResearcherId}`)
      .then(r => r.json())
      .then(data => setRequests(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, researcherId])

  if (loading) {
    return (
      <DashboardShell role="researcher" title="My Access Requests">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading requests...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="researcher" title="My Access Requests">
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">No requests yet</p>
              <p className="text-sm text-muted-foreground">Search for datasets and request access to get started.</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.requestId} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base text-foreground">Dataset: {request.genomicRecordId}</CardTitle>
                  <p className="text-sm text-muted-foreground">Request ID: {request.requestId} | PID: {request.pid}</p>
                </div>
                <StatusBadge status={request.status} />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Purpose</p>
                    <p className="text-sm font-medium text-foreground">{request.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium text-foreground">{request.durationDays} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-sm font-medium text-foreground">{new Date(request.requestedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">On-Chain ID</p>
                    <p className="text-sm font-medium text-foreground">{request.blockchainRequestId || 'N/A'}</p>
                  </div>
                </div>
                {request.status === "Approved" && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">Access granted. You can download this dataset.</span>
                  </div>
                )}
                {request.status === "Pending" && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm text-warning">Waiting for patient consent approval.</span>
                  </div>
                )}
                {request.status === "Rejected" && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Access request was denied by the data owner.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  )
}
