"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AccessRequest } from "@/lib/types"
import {
  FileText,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  AlertCircle,
  Shield,
  KeyRound,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Request Form — shown when ?dataset= & ?pid= query params present  */
/* ------------------------------------------------------------------ */
function RequestForm({
  dataset,
  pid,
  onDone,
}: {
  dataset: string
  pid: string
  onDone: () => void
}) {
  const router = useRouter()
  const { walletAddress, researcherId, displayName, institution } = useAuth()

  const [purpose, setPurpose] = useState("")
  const [durationDays, setDurationDays] = useState("30")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!purpose.trim()) {
      setError("Please provide a research purpose.")
      return
    }

    const days = parseInt(durationDays)
    if (isNaN(days) || days < 1 || days > 365) {
      setError("Duration must be between 1 and 365 days.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid,
          researcherId: researcherId || walletAddress,
          researcherName: displayName || walletAddress || "Unknown Researcher",
          institution: institution || "Unknown Institution",
          genomicRecordId: dataset,
          purpose: purpose.trim(),
          durationDays: days,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request")
      }

      setSuccess(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  /* Success state */
  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-primary/30 bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h2 className="mt-4 text-xl font-bold text-foreground">Request Submitted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your access request for dataset <strong className="text-primary">{dataset}</strong> has been submitted.
          The data owner will review your request.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={onDone}>
            View My Requests
          </Button>
          <Button onClick={() => router.push("/researcher/search")}>
            Search More
          </Button>
        </div>
      </div>
    )
  }

  /* Form */
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <button
          onClick={() => router.push("/researcher/search")}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to search
        </button>
        <h1 className="text-2xl font-bold text-foreground">Request Data Access</h1>
        <p className="mt-1 text-muted-foreground">
          Submit a formal request to access the genomic dataset. The data owner will review and approve or deny.
        </p>
      </div>

      {/* Dataset info */}
      <div className="mb-6 rounded-xl border border-border/50 bg-secondary/30 p-5">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Dataset: <span className="font-mono text-primary">{dataset}</span>
            </p>
            <p className="text-xs text-muted-foreground">Patient ID: {pid}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only researcher info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Researcher</label>
            <Input
              value={displayName || walletAddress || ""}
              disabled
              className="border-border bg-secondary text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Institution</label>
            <Input
              value={institution || "Not specified"}
              disabled
              className="border-border bg-secondary text-muted-foreground"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Research Purpose <span className="text-destructive">*</span>
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe why you need access (e.g., genomic variant analysis for oncology research...)"
            rows={4}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Access Duration (days) <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="max-w-[180px] border-border bg-card text-foreground"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">Between 1 and 365 days</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/researcher/search")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Request List — the default view                                   */
/* ------------------------------------------------------------------ */
function RequestList() {
  const { walletAddress, researcherId } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    const queryResearcherId = researcherId || walletAddress
    fetch(`/api/access-requests?researcherId=${queryResearcherId}`)
      .then((r) => r.json())
      .then((data) => setRequests(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, researcherId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">Loading requests...</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Access Requests</h1>
        <p className="mt-1 text-muted-foreground">
          Track and manage your data access requests.
        </p>
      </div>

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
                <p className="text-sm text-muted-foreground">
                  Request ID: {request.requestId} | PID: {request.pid}
                </p>
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
                  <p className="text-sm font-medium text-foreground">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">On-Chain ID</p>
                  <p className="text-sm font-medium text-foreground">{request.blockchainRequestId || "N/A"}</p>
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
  )
}

/* ------------------------------------------------------------------ */
/*  Content router — reads search params to decide form vs list       */
/* ------------------------------------------------------------------ */
function RequestsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const dataset = searchParams.get("dataset")
  const pid = searchParams.get("pid")

  // If query params present → show the request form, otherwise show list
  if (dataset && pid) {
    return (
      <RequestForm
        dataset={dataset}
        pid={pid}
        onDone={() => router.replace("/researcher/requests")}
      />
    )
  }

  return <RequestList />
}

/* ------------------------------------------------------------------ */
/*  Page export — wraps in Suspense for useSearchParams                */
/* ------------------------------------------------------------------ */
export default function ResearcherRequestsPage() {
  return (
    <DashboardShell role="researcher">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Loading...
          </div>
        }
      >
        <RequestsContent />
      </Suspense>
    </DashboardShell>
  )
}
