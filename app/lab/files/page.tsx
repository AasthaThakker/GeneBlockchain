"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAuth } from "@/lib/auth-context"
import {
    Shield,
    Lock,
    ExternalLink,
    HardDrive,
    FileText,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface IPFSFile {
    recordId: string
    pid: string
    labId: string
    labName: string
    fileType: string
    ipfsCID: string
    fileHash: string
    encrypted: boolean
    uploadDate: string
    status: string
    blockchainTxHash: string
    gatewayUrl: string | null
    ipfsAvailable: boolean
}

interface FileSummary {
    totalFiles: number
    totalEncrypted: number
    ipfsNodeOnline: boolean
}

export default function LabFiles() {
    const { labId, walletAddress } = useAuth()
    const [files, setFiles] = useState<IPFSFile[]>([])
    const [summary, setSummary] = useState<FileSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [copiedCID, setCopiedCID] = useState<string | null>(null)
    const [downloading, setDownloading] = useState<string | null>(null)

    const handleDownload = async (file: IPFSFile) => {
        setDownloading(file.recordId)
        try {
            const res = await fetch(
                `/api/upload?cid=${encodeURIComponent(file.ipfsCID)}&decrypt=true`
            )
            if (!res.ok) throw new Error("Download failed")
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${file.recordId}_${file.fileType.toLowerCase()}.${file.fileType === "VCF" ? "vcf" : "fasta"}`
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

    const fetchFiles = async () => {
        setLoading(true)
        try {
            const currentLabId = labId || walletAddress || ""
            const res = await fetch(`/api/ipfs/files?labId=${currentLabId}`)
            const data = await res.json()
            setFiles(data.data || [])
            setSummary(data.summary || null)
        } catch (error) {
            console.error("Failed to fetch files:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFiles()
    }, [labId, walletAddress])

    const copyCID = (cid: string) => {
        navigator.clipboard.writeText(cid)
        setCopiedCID(cid)
        setTimeout(() => setCopiedCID(null), 2000)
    }

    const truncateCID = (cid: string) =>
        cid ? `${cid.slice(0, 12)}...${cid.slice(-8)}` : "—"

    if (loading) {
        return (
            <DashboardShell role="lab">
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading IPFS files...
                </div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell role="lab">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">IPFS File Storage</h1>
                    <p className="mt-1 text-muted-foreground">
                        All genomic files uploaded and pinned on your local IPFS node
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchFiles}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/50 bg-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <HardDrive className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{summary.totalFiles}</p>
                                <p className="text-xs text-muted-foreground">Total Files Stored</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                                <Lock className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{summary.totalEncrypted}</p>
                                <p className="text-xs text-muted-foreground">AES-256 Encrypted</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card p-5">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${summary.ipfsNodeOnline ? "bg-success/10" : "bg-destructive/10"}`}>
                                {summary.ipfsNodeOnline ? (
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">{summary.ipfsNodeOnline ? "Online" : "Offline"}</p>
                                <p className="text-xs text-muted-foreground">IPFS Node Status</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Files List */}
            {files.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                    <HardDrive className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No files uploaded yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Upload a VCF or FASTA file from the Upload page to see it here.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {files.map((file) => (
                        <div
                            key={file.recordId}
                            className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30"
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                {/* Left: File Info */}
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-mono text-sm font-bold text-primary">{file.recordId}</h3>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                {file.fileType}
                                            </span>
                                            {file.encrypted && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                                    <Lock className="h-3 w-3" /> AES-256
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Patient: {file.pid} &bull; {file.labName} &bull; {new Date(file.uploadDate).toLocaleString()}
                                        </p>

                                        {/* CID Row */}
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">CID:</span>
                                            <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">
                                                {truncateCID(file.ipfsCID)}
                                            </code>
                                            <button
                                                onClick={() => copyCID(file.ipfsCID)}
                                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                                title="Copy full CID"
                                            >
                                                {copiedCID === file.ipfsCID ? (
                                                    <Check className="h-3.5 w-3.5 text-success" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Hash */}
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">SHA-256:</span>
                                            <code className="max-w-[280px] truncate rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                                                {file.fileHash}
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex gap-2 sm:flex-col">
                                    <Button
                                        size="sm"
                                        className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                                        onClick={() => handleDownload(file)}
                                        disabled={downloading === file.recordId}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        {downloading === file.recordId ? "Decrypting..." : "Download"}
                                    </Button>
                                    {file.gatewayUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => window.open(file.gatewayUrl!, "_blank")}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" /> View on IPFS
                                        </Button>
                                    )}
                                    {file.blockchainTxHash && (
                                        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5">
                                            <Shield className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-xs text-muted-foreground">On-chain</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Notice */}
            <div className="mt-8 rounded-xl border border-border/50 bg-secondary/30 p-6">
                <h3 className="text-sm font-semibold text-foreground">About IPFS Storage</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Files are encrypted with <strong>AES-256-CBC</strong> before being stored on IPFS. Each file is
                    content-addressed by its CID (Content Identifier) and pinned to prevent garbage collection.
                    The file hash (SHA-256) is registered on-chain for tamper-proof integrity verification.
                </p>
            </div>
        </DashboardShell>
    )
}
