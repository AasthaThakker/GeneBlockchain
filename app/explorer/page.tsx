"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
    Dna,
    ArrowLeft,
    Shield,
    Blocks,
    FileText,
    ShieldCheck,
    Users,
    Vote,
    CheckCircle2,
    XCircle,
    Clock,
    Activity,
    RefreshCw,
    Loader2,
    Hash,
    Eye,
    EyeOff,
    UserPlus,
    ThumbsUp,
    AlertTriangle,
} from "lucide-react"

interface Stats {
    totalRecords: number
    totalConsents: number
    totalProposals: number
    members: { patients: number; labs: number; researchers: number }
    totalEvents: number
}

interface GenomicRecord {
    index: number
    pid: string
    fileHash: string
    ipfsCID: string
    registeredBy: string
    timestamp: number
}

interface Consent {
    index: number
    pid: string
    researcher: string
    recordIndex: number
    grantedAt: number
    expiresAt: number
    revoked: boolean
}

interface Proposal {
    id: number
    applicant: string
    requestedRole: string
    approveCount: number
    rejectCount: number
    deadline: number
    status: string
}

interface BlockchainEvent {
    name: string
    blockNumber: number
    txHash: string
    args: Record<string, string | number | boolean>
}

const EVENT_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
    GenomicDataRegistered: { icon: FileText, color: "text-blue-500", label: "Data Registered" },
    ConsentGranted: { icon: ShieldCheck, color: "text-emerald-500", label: "Consent Granted" },
    ConsentRevoked: { icon: EyeOff, color: "text-red-500", label: "Consent Revoked" },
    DataAccessed: { icon: Eye, color: "text-violet-500", label: "Data Accessed" },
    AccessDenied: { icon: AlertTriangle, color: "text-amber-500", label: "Access Denied" },
    RegistrationProposed: { icon: UserPlus, color: "text-cyan-500", label: "Registration Proposed" },
    RegistrationVoted: { icon: Vote, color: "text-indigo-500", label: "Vote Cast" },
    RegistrationApproved: { icon: CheckCircle2, color: "text-emerald-500", label: "Registration Approved" },
    RegistrationRejected: { icon: XCircle, color: "text-red-500", label: "Registration Rejected" },
}

function truncateAddr(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function truncateHash(hash: string) {
    return `${hash.slice(0, 10)}…${hash.slice(-6)}`
}

function formatTimestamp(ts: number) {
    if (ts === 0) return "—"
    const d = new Date(ts * 1000)
    return d.toLocaleString()
}

type TabKey = "events" | "records" | "consents" | "proposals"

export default function ExplorerPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [blockNumber, setBlockNumber] = useState(0)
    const [stats, setStats] = useState<Stats | null>(null)
    const [records, setRecords] = useState<GenomicRecord[]>([])
    const [consents, setConsents] = useState<Consent[]>([])
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [events, setEvents] = useState<BlockchainEvent[]>([])
    const [activeTab, setActiveTab] = useState<TabKey>("events")

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/blockchain-explorer")
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setBlockNumber(data.blockNumber)
            setStats(data.stats)
            setRecords(data.records || [])
            setConsents(data.consents || [])
            setProposals(data.proposals || [])
            setEvents((data.events || []).reverse()) // newest first
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load blockchain data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: "events", label: "Event Log", count: events.length },
        { key: "records", label: "Genomic Records", count: records.length },
        { key: "consents", label: "Consents", count: consents.length },
        { key: "proposals", label: "Proposals", count: proposals.length },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
                            <Dna className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xl font-bold text-foreground">GenShare</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <nav className="hidden md:flex items-center gap-6">
                            <a href="/features" className="text-sm font-medium hover:text-primary transition-colors">
                                Features
                            </a>
                            <a href="/explorer" className="text-sm font-medium text-primary transition-colors">
                                Explorer
                            </a>
                            <a href="/#roles" className="text-sm font-medium hover:text-primary transition-colors">
                                Access Portal
                            </a>
                        </nav>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/")}
                            className="gap-2 border-border text-foreground md:hidden"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Home
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12">
                {/* Page Title */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Blocks className="h-8 w-8 text-primary" />
                            Blockchain Explorer
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Real-time visualization of all on-chain transactions and contract state
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm text-muted-foreground">Block</span>
                            <span className="font-mono text-sm font-semibold text-foreground">#{blockNumber}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            disabled={loading}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {loading && !stats ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading blockchain state…</p>
                    </div>
                ) : stats ? (
                    <>
                        {/* Stats Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10">
                            {[
                                { label: "Genomic Records", value: stats.totalRecords, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                                { label: "Consents", value: stats.totalConsents, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                { label: "Proposals", value: stats.totalProposals, icon: Vote, color: "text-violet-500", bg: "bg-violet-500/10" },
                                { label: "Total Events", value: stats.totalEvents, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
                                { label: "Members", value: stats.members.patients + stats.members.labs + stats.members.researchers, icon: Users, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Member Breakdown */}
                        <div className="rounded-xl border border-border/50 bg-card p-6 mb-10">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Registered Members by Role</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { role: "Patients", count: stats.members.patients, color: "bg-primary" },
                                    { role: "Labs", count: stats.members.labs, color: "bg-chart-2" },
                                    { role: "Researchers", count: stats.members.researchers, color: "bg-chart-3" },
                                ].map((m) => {
                                    const total = stats.members.patients + stats.members.labs + stats.members.researchers
                                    const pct = total > 0 ? Math.round((m.count / total) * 100) : 0
                                    return (
                                        <div key={m.role} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-foreground">{m.role}</span>
                                                <span className="text-sm text-muted-foreground">{m.count}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                                <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-border/50 mb-6">
                            <div className="flex gap-0">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                                ? "border-primary text-primary"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {tab.label}
                                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-mono">
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "events" && (
                            <div className="space-y-2">
                                {events.length === 0 ? (
                                    <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                                        <Activity className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                        <p className="mt-4 text-foreground font-medium">No Events</p>
                                        <p className="text-sm text-muted-foreground">No blockchain events have been emitted yet.</p>
                                    </div>
                                ) : (
                                    events.map((evt, i) => {
                                        const config = EVENT_CONFIG[evt.name] || { icon: Activity, color: "text-muted-foreground", label: evt.name }
                                        const Icon = config.icon
                                        return (
                                            <div key={i} className="rounded-lg border border-border/50 bg-card px-5 py-4 flex items-start gap-4 hover:border-border transition-colors">
                                                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color.replace('text-', 'bg-')}/10`}>
                                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">Block #{evt.blockNumber}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                        {Object.entries(evt.args).map(([key, val]) => (
                                                            <span key={key} className="text-xs text-muted-foreground">
                                                                <span className="text-foreground/70">{key}:</span>{" "}
                                                                <code className="bg-secondary rounded px-1 py-0.5 font-mono">
                                                                    {typeof val === "string" && val.startsWith("0x") && val.length > 16
                                                                        ? truncateAddr(val)
                                                                        : typeof val === "string" && val.length > 24
                                                                            ? truncateHash(val)
                                                                            : String(val)}
                                                                </code>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground font-mono">
                                                    <Hash className="h-3 w-3" />
                                                    {evt.txHash.slice(0, 10)}…
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === "records" && (
                            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                                {records.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                        <p className="mt-4 text-foreground font-medium">No Records</p>
                                        <p className="text-sm text-muted-foreground">No genomic data has been registered on-chain yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-secondary/50">
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">#</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">PID</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File Hash</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">IPFS CID</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Registered By</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {records.map((rec) => (
                                                <tr key={rec.index} className="hover:bg-secondary/30 transition-colors">
                                                    <td className="px-5 py-3 text-sm font-mono text-foreground">{rec.index}</td>
                                                    <td className="px-5 py-3 text-sm font-mono text-primary">{rec.pid}</td>
                                                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{truncateHash(rec.fileHash)}</td>
                                                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{truncateHash(rec.ipfsCID)}</td>
                                                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{truncateAddr(rec.registeredBy)}</td>
                                                    <td className="px-5 py-3 text-sm text-muted-foreground">{formatTimestamp(rec.timestamp)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === "consents" && (
                            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                                {consents.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                        <p className="mt-4 text-foreground font-medium">No Consents</p>
                                        <p className="text-sm text-muted-foreground">No consent grants have been recorded on-chain yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-secondary/50">
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">#</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">PID</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Researcher</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Record</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Granted</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Expires</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {consents.map((c) => {
                                                const isActive = !c.revoked && c.expiresAt * 1000 > Date.now()
                                                return (
                                                    <tr key={c.index} className="hover:bg-secondary/30 transition-colors">
                                                        <td className="px-5 py-3 text-sm font-mono text-foreground">{c.index}</td>
                                                        <td className="px-5 py-3 text-sm font-mono text-primary">{c.pid}</td>
                                                        <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{truncateAddr(c.researcher)}</td>
                                                        <td className="px-5 py-3 text-sm font-mono text-muted-foreground">#{c.recordIndex}</td>
                                                        <td className="px-5 py-3 text-sm text-muted-foreground">{formatTimestamp(c.grantedAt)}</td>
                                                        <td className="px-5 py-3 text-sm text-muted-foreground">{formatTimestamp(c.expiresAt)}</td>
                                                        <td className="px-5 py-3">
                                                            {c.revoked ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500 border border-red-500/20">
                                                                    <XCircle className="h-3 w-3" /> Revoked
                                                                </span>
                                                            ) : isActive ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
                                                                    <Clock className="h-3 w-3" /> Expired
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === "proposals" && (
                            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                                {proposals.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Vote className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                        <p className="mt-4 text-foreground font-medium">No Proposals</p>
                                        <p className="text-sm text-muted-foreground">No registration proposals have been submitted yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-secondary/50">
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">#</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Applicant</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Votes</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Deadline</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {proposals.map((p) => (
                                                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                                                    <td className="px-5 py-3 text-sm font-mono text-foreground">{p.id}</td>
                                                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{truncateAddr(p.applicant)}</td>
                                                    <td className="px-5 py-3">
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                                                            {p.requestedRole}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-sm">
                                                        <span className="inline-flex items-center gap-2">
                                                            <span className="flex items-center gap-1 text-emerald-500">
                                                                <ThumbsUp className="h-3 w-3" /> {p.approveCount}
                                                            </span>
                                                            <span className="text-muted-foreground/40">|</span>
                                                            <span className="flex items-center gap-1 text-red-500">
                                                                <XCircle className="h-3 w-3" /> {p.rejectCount}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-muted-foreground">{formatTimestamp(p.deadline)}</td>
                                                    <td className="px-5 py-3">
                                                        {p.status === "Approved" ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                                                                <CheckCircle2 className="h-3 w-3" /> Approved
                                                            </span>
                                                        ) : p.status === "Rejected" ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500 border border-red-500/20">
                                                                <XCircle className="h-3 w-3" /> Rejected
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
                                                                <Clock className="h-3 w-3" /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                ) : null}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 bg-card/50 py-12">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">GenShare</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        A Blockchain-Based Genomic Data Sharing Platform
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Ethereum Sepolia Testnet | IPFS Off-Chain Storage | HIPAA/GDPR Aligned
                    </p>
                </div>
            </footer>
        </div>
    )
}
