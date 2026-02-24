"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { GenomicRecord } from "@/lib/types"
import {
  Download,
  Lock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Shield,
} from "lucide-react"

export default function PatientDownload() {
  const { walletAddress, pid } = useAuth()
  const [records, setRecords] = useState<GenomicRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [copiedCID, setCopiedCID] = useState<string | null>(null)

  useEffect(() => {
    if (!walletAddress) return
    const patientPid = pid || `PID-${walletAddress.slice(2, 8)}`
    fetch(`/api/genomic-records?pid=${patientPid}`)
      .then((r) => r.json())
      .then((data) => setRecords(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, pid])

  const handleDownload = async (record: GenomicRecord) => {
    setDownloading(record.recordId)
    try {
      const res = await fetch(
        `/api/upload?cid=${encodeURIComponent(record.ipfsCID)}&decrypt=true`
      )
      if (!res.ok) {
        throw new Error("Download failed")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${record.recordId}_${record.fileType.toLowerCase()}.bin`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Download failed: ${(error as Error).message}`)
    } finally {
      setDownloading(null)
    }
  }

  const copyCID = (cid: string) => {
    navigator.clipboard.writeText(cid)
    setCopiedCID(cid)
    setTimeout(() => setCopiedCID(null), 2000)
  }

  const truncateCID = (cid: string) =>
    cid ? `${cid.slice(0, 12)}...${cid.slice(-8)}` : "—"

  const openOnIPFS = (cid: string) => {
    const gatewayUrl =
      process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://127.0.0.1:8080"
    window.open(`${gatewayUrl}/ipfs/${cid}`, "_blank")
  }

  if (loading) {
    return (
      <DashboardShell role="patient">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading
          records...
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Download Records</h1>
        <p className="mt-1 text-muted-foreground">
          Download your encrypted genomic files from IPFS. Files are AES-256
          encrypted.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {records.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No records found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your genomic records will appear here after they are uploaded by a
              lab.
            </p>
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.recordId}
              className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-bold text-foreground">
                        {record.recordId}
                      </p>
                      <StatusBadge status={record.status} />
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        <Shield className="h-3 w-3" /> AES-256
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {record.fileType} | {record.labName} |{" "}
                      {new Date(record.uploadDate).toLocaleDateString()}
                    </p>

                    {/* CID with copy */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        IPFS:
                      </span>
                      <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">
                        {truncateCID(record.ipfsCID)}
                      </code>
                      <button
                        onClick={() => copyCID(record.ipfsCID)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        title="Copy full CID"
                      >
                        {copiedCID === record.ipfsCID ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* File hash */}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        SHA-256:
                      </span>
                      <code className="max-w-[240px] truncate rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {record.fileHash}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openOnIPFS(record.ipfsCID)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View on IPFS
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(record)}
                    disabled={downloading === record.recordId}
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloading === record.recordId
                      ? "Decrypting..."
                      : "Download"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 rounded-xl border border-border/50 bg-secondary/30 p-6">
        <h3 className="text-sm font-semibold text-foreground">
          Encryption Notice
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          All genomic files are encrypted with <strong>AES-256-CBC</strong> before
          being stored on IPFS. When you download a file, it is decrypted
          server-side using the platform encryption key. The raw genomic data
          never travels unencrypted over the network. The SHA-256 hash verifies
          file integrity against the on-chain record.
        </p>
      </div>
    </DashboardShell>
  )
}
