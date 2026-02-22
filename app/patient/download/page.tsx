"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { GenomicRecord } from "@/lib/types"
import { Download, Lock } from "lucide-react"

export default function PatientDownload() {
  const { walletAddress, pid } = useAuth()
  const [records, setRecords] = useState<GenomicRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!walletAddress) return
    const patientPid = pid || `PID-${walletAddress.slice(2, 8)}`
    fetch(`/api/genomic-records?pid=${patientPid}`)
      .then(r => r.json())
      .then(data => setRecords(data.data || []))
      .finally(() => setLoading(false))
  }, [walletAddress, pid])

  const handleDownload = (id: string) => {
    setDownloading(id)
    setTimeout(() => {
      setDownloading(null)
      alert(`Simulated download of encrypted genomic file ${id} from IPFS`)
    }, 1500)
  }

  if (loading) {
    return (
      <DashboardShell role="patient">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading records...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Download Records</h1>
        <p className="mt-1 text-muted-foreground">
          Download your encrypted genomic files from IPFS. Files are AES-256 encrypted.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {records.map((record) => (
          <div key={record.recordId} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold text-foreground">{record.recordId}</p>
                  <StatusBadge status={record.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {record.fileType} | {record.labName} | {new Date(record.uploadDate).toLocaleDateString()}
                </p>
                <p className="mt-1 max-w-lg truncate font-mono text-xs text-muted-foreground">
                  IPFS: {record.ipfsCID}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => handleDownload(record.recordId)} disabled={downloading === record.recordId} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="h-3.5 w-3.5" />
              {downloading === record.recordId ? "Decrypting..." : "Download"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border/50 bg-secondary/30 p-6">
        <h3 className="text-sm font-semibold text-foreground">Encryption Notice</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          All genomic files are encrypted with AES-256 before being stored on IPFS. When you
          download a file, it is decrypted locally using your wallet&apos;s private key. The raw
          genomic data never travels unencrypted over the network.
        </p>
      </div>
    </DashboardShell>
  )
}
