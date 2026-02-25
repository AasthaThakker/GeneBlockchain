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

interface Block {
    number: number
    hash: string
    timestamp: number
    transactions: number
    gasUsed: string
    gasLimit: string
    miner: string
}

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
    if (!hash) return "—"
    return `${hash.slice(0, 10)}…${hash.slice(-6)}`
}

function formatTimestamp(ts: number) {
    if (ts === 0) return "—"
    const d = new Date(ts * 1000)
    return d.toLocaleString()
}

function getTimeAgo(ts: number) {
    const seconds = Math.floor(Date.now() / 1000 - ts)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
}

type TabKey = "blocks" | "events" | "records" | "consents" | "proposals"

export default function ExplorerPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [blockNumber, setBlockNumber] = useState(0)
    const [gasPrice, setGasPrice] = useState("0")
    const [chainId, setChainId] = useState<string | null>(null)
    const [networkName, setNetworkName] = useState<string | null>(null)
    const [blocks, setBlocks] = useState<Block[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [records, setRecords] = useState<GenomicRecord[]>([])
    const [consents, setConsents] = useState<Consent[]>([])
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [events, setEvents] = useState<BlockchainEvent[]>([])
    const [activeTab, setActiveTab] = useState<TabKey>("blocks")
    const [autoRefresh, setAutoRefresh] = useState(true)

    const fetchData = useCallback(async (isAuto = false) => {
        if (!isAuto) setLoading(true)
        try {
            const res = await fetch("/api/blockchain-explorer")
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setBlockNumber(data.blockNumber)
            setGasPrice(data.gasPrice)
            setChainId(data.chainId)
            setNetworkName(data.networkName)
            setBlocks(data.blocks || [])
            setStats(data.stats)
            setRecords(data.records || [])
            setConsents(data.consents || [])
            setProposals(data.proposals || [])
            setEvents((data.events || []).reverse())
        } catch (err) {
            if (!isAuto) setError(err instanceof Error ? err.message : "Failed to load blockchain data")
        } finally {
            if (!isAuto) setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        if (!autoRefresh) return
        const interval = setInterval(() => fetchData(true), 5000)
        return () => clearInterval(interval)
    }, [autoRefresh, fetchData])

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: "blocks", label: "Blocks", count: blocks.length },
        { key: "events", label: "Event Log", count: events.length },
        { key: "records", label: "Genomic Records", count: records.length },
        { key: "consents", label: "Consents", count: consents.length },
        { key: "proposals", label: "Proposals", count: proposals.length },
    ]

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            {/* Header */}
            <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 shadow-sm shadow-primary/20">
                            <Dna className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">GenShare</span>
                    </button>

                    <div className="flex items-center gap-6">
                        <nav className="hidden lg:flex items-center gap-8">
                            <a href="/features" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Features</a>
                            <a href="/explorer" className="text-sm font-semibold text-primary transition-colors">Explorer</a>
                            <a href="/#roles" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Access Portal</a>
                        </nav>
                        <div className="h-6 w-px bg-border/50 hidden lg:block" />
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/")}
                                className="gap-2 border-border text-foreground hidden sm:flex font-semibold"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Home
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12">
                {/* Page Title & Status */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20 animate-in fade-in slide-in-from-left-4">
                                LIVE NETWORK
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Activity className="h-3.5 w-3.5 text-success animate-pulse" />
                                <span className="text-xs font-medium text-success uppercase tracking-widest">Healthy</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-4">
                            Blockchain <span className="text-primary underline decoration-primary/30 decoration-4 underline-offset-8">Explorer</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-secondary/30 p-1 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background shadow-sm border border-border/50">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{networkName || "Network"}</span>
                            <span className="font-mono text-sm font-black text-foreground">
                                ID: {chainId || "—"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background shadow-sm border border-border/50">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Base Fee</span>
                            <span className="font-mono text-sm font-black text-foreground">
                                {gasPrice !== "0" ? `${Math.round(Number(gasPrice) / 1e9)}` : "—"} <span className="text-[10px] text-muted-foreground uppercase">Gwei</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Syncing</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`h-6 px-2 rounded-lg text-[10px] font-bold uppercase transition-all ${autoRefresh ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                            >
                                {autoRefresh ? "Enabled" : "Disabled"}
                            </Button>
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => fetchData()}
                            disabled={loading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-xl font-bold shadow-lg shadow-primary/20"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Sync
                        </Button>
                    </div>
                </div>

                {/* Network Stats - Compact Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                    {[
                        { label: "Total Blocks", value: blockNumber, icon: Blocks, color: "text-primary", bg: "bg-primary/10" },
                        { label: "Active Chains", value: 1, icon: Hash, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                        { label: "On-Chain Records", value: stats?.totalRecords || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Verified Consents", value: stats?.totalConsents || 0, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Governance Proposals", value: stats?.totalProposals || 0, icon: Vote, color: "text-violet-500", bg: "bg-violet-500/10" },
                        { label: "Network Events", value: stats?.totalEvents || 0, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
                    ].map((stat, i) => (
                        <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{i + 1}</span>
                            </div>
                            <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter mb-1">{stat.value}</div>
                            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Visual Blockchain View */}
                <div className="mb-10 group">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <Blocks className="h-5 w-5 text-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Block Chain Visualization</h2>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">Auto-updating every 5s</span>
                    </div>
                    <div className="relative flex items-center gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar px-2 mask-linear-fade">
                        {blocks.map((block, i) => (
                            <div key={block.number} className="flex items-center gap-4 shrink-0 animate-in fade-in slide-in-from-right-8" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`flex flex-col w-48 rounded-2xl border-2 p-4 transition-all hover:scale-105 hover:shadow-2xl ${i === 0 ? "border-primary bg-primary/5 shadow-primary/10" : "border-border/50 bg-card hover:border-primary/30"}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                                            {i === 0 ? "Newest Block" : `Block #${block.number}`}
                                        </span>
                                        <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                                    </div>
                                    <div className="font-mono text-sm font-bold text-foreground mb-1 truncate">#{block.number}</div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-4">
                                        <Clock className="h-3 w-3" />
                                        <span>{getTimeAgo(block.timestamp)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <div className="rounded-lg bg-secondary/50 p-2 text-center">
                                            <div className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">TXs</div>
                                            <div className="text-xs font-black text-foreground leading-none">{block.transactions}</div>
                                        </div>
                                        <div className="rounded-lg bg-secondary/50 p-2 text-center">
                                            <div className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Gas</div>
                                            <div className="text-xs font-black text-foreground leading-none">
                                                {Math.round(Number(block.gasUsed) / 1e6)}M
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {i < blocks.length - 1 && (
                                    <div className="flex flex-col items-center gap-1 opacity-30">
                                        <div className="h-[2px] w-8 bg-gradient-to-r from-primary to-border" />
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Linked</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-1">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 mb-4">Data Explorers</h3>
                        {tabs.map((tab) => {
                            const Icon = tab.key === "blocks" ? Blocks :
                                tab.key === "events" ? Activity :
                                    tab.key === "records" ? FileText :
                                        tab.key === "consents" ? ShieldCheck : Vote
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.key
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </div>
                                    <span className={`tabular-nums text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-secondary"}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Display */}
                    <div className="lg:col-span-3">
                        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">
                            <div className="border-b border-border/50 bg-secondary/10 px-8 py-4 flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                                    {tabs.find(t => t.key === activeTab)?.label}
                                </h3>
                                <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    SYNCED WITH BLOCK #{blockNumber}
                                </div>
                            </div>

                            <div className="p-2 sm:p-6 overflow-x-auto">
                                {activeTab === "blocks" && (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/30">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Number</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hash</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">TXs</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gas Used</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {blocks.map((block) => (
                                                <tr key={block.number} className="group hover:bg-secondary/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-black text-primary font-mono">#{block.number}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">{truncateHash(block.hash)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center justify-center rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-foreground">
                                                            {block.transactions}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-muted-foreground font-medium">{formatTimestamp(block.timestamp)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all duration-1000"
                                                                    style={{ width: `${Math.min(100, (Number(block.gasUsed) / Number(block.gasLimit)) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[9px] font-bold text-muted-foreground tabular-nums">
                                                                {Math.round(Number(block.gasUsed) / 1000).toLocaleString()}k units
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === "events" && (
                                    <div className="space-y-3">
                                        {events.map((evt, i) => {
                                            const config = EVENT_CONFIG[evt.name] || { icon: Activity, color: "text-muted-foreground", label: evt.name }
                                            const Icon = config.icon
                                            return (
                                                <div key={i} className="group rounded-2xl border border-border/50 bg-background px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-all hover:bg-secondary/5">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.color.replace('text-', 'bg-')}/10 border border-${config.color.split('-')[1]}-500/20 shadow-sm`}>
                                                        <Icon className={`h-5 w-5 ${config.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1.5">
                                                            <span className={`text-xs font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                                                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Block #{evt.blockNumber}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                            {Object.entries(evt.args).map(([key, val]) => (
                                                                <div key={key} className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{key}</span>
                                                                    <code className="text-[11px] font-bold text-foreground font-mono">
                                                                        {typeof val === "string" && val.startsWith("0x") && val.length > 20
                                                                            ? truncateAddr(val)
                                                                            : String(val)}
                                                                    </code>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border/40 text-[10px] font-mono font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <Hash className="h-3 w-3" />
                                                        {evt.txHash.slice(0, 14)}…
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {activeTab === "records" && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {records.map((rec) => (
                                            <div key={rec.index} className="p-5 rounded-2xl border border-border/50 bg-background hover:border-primary/30 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-black text-primary font-mono uppercase tracking-widest">Index #{rec.index}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{formatTimestamp(rec.timestamp)}</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Patient ID</span>
                                                        <span className="text-sm font-bold text-foreground font-mono bg-secondary/30 px-2 py-1 rounded-lg w-fit">{rec.pid}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">IPFS CID</span>
                                                            <span className="text-xs font-bold text-muted-foreground font-mono truncate">{truncateHash(rec.ipfsCID)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Registered By</span>
                                                            <span className="text-xs font-bold text-muted-foreground font-mono truncate">{truncateAddr(rec.registeredBy)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "consents" && (
                                    <div className="space-y-4">
                                        {consents.map((c) => {
                                            const isActive = !c.revoked && c.expiresAt * 1000 > Date.now()
                                            return (
                                                <div key={c.index} className="rounded-2xl border border-border/50 bg-background p-5 hover:border-primary/30 transition-all">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                                                <ShieldCheck className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Consent #{c.index}</h4>
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">FOR RECORD #{c.recordIndex}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PID</span>
                                                                <span className="text-xs font-bold text-foreground font-mono">{c.pid}</span>
                                                            </div>
                                                            <div className="h-8 w-px bg-border/50" />
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Researcher</span>
                                                                <span className="text-xs font-bold text-foreground font-mono">{truncateAddr(c.researcher)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50">
                                                            {c.revoked ? (
                                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5"><XCircle className="h-3 w-3" /> Revoked</span>
                                                            ) : isActive ? (
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Active</span>
                                                            ) : (
                                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><Clock className="h-3 w-3" /> Expired</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {activeTab === "proposals" && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {proposals.map((p) => (
                                            <div key={p.id} className="rounded-2xl border border-border/50 bg-background p-6 hover:border-primary/30 transition-all">
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-[10px] font-black text-primary border border-primary/20 uppercase tracking-widest">
                                                        {p.requestedRole} Request
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === "Approved" ? "text-emerald-500" : p.status === "Rejected" ? "text-red-500" : "text-amber-500"}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-4 mb-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Applicant</span>
                                                        <span className="text-xs font-bold font-mono text-foreground truncate">{p.applicant}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 bg-secondary/30 rounded-2xl p-4">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Yes</span>
                                                        <span className="text-xl font-black text-foreground tabular-nums tracking-tighter">{p.approveCount}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">No</span>
                                                        <span className="text-xl font-black text-foreground tabular-nums tracking-tighter">{p.rejectCount}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Network Footer */}
            <footer className="border-t border-border/50 bg-card py-16">
                <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-3 gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <Dna className="h-6 w-6 text-primary" />
                            <span className="text-xl font-black tracking-tighter text-foreground">GenShare <span className="text-xs font-bold text-muted-foreground/50">v0.1</span></span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                            Decentralized genomic intelligence network. Powered by Ethereum smart contracts and secure off-chain IPFS storage.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Network Config</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Hardhat Localhost:8545
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> IPFS Desktop:5001
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Compliance</h4>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {["HIPAA", "GDPR", "FERPA", "SOC2"].map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded bg-secondary text-[9px] font-black text-muted-foreground/70">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
