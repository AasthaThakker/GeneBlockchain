"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Mail,
    Wallet,
    Building2,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    RefreshCw,
    Microscope,
} from "lucide-react"

interface VoteRecord {
    voter: string
    approve: boolean
    txHash: string
    timestamp: string
}

interface RegistrationRequest {
    _id: string
    applicantAddress: string
    role: string
    name: string
    email: string
    institution?: string
    proposalId: number
    status: string
    txHash: string
    votes: VoteRecord[]
    expiresAt: string
    createdAt: string
}

export default function ResearcherRegistrationsPage() {
    const { walletAddress } = useAuth()
    const [requests, setRequests] = useState<RegistrationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [votingId, setVotingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/registration-requests?role=RESEARCHER&status=pending")
            const data = await res.json()
            if (data.success) {
                setRequests(data.requests)
            }
        } catch {
            setError("Failed to load registration requests")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const handleVote = async (proposalId: number, approve: boolean) => {
        if (!walletAddress) {
            setError("Please connect your wallet to vote")
            return
        }
        setVotingId(`${proposalId}-${approve ? "approve" : "reject"}`)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch("/api/registration-requests/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    proposalId,
                    approve,
                    voterWallet: walletAddress,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setSuccess(data.message)
            fetchRequests()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Vote failed")
        } finally {
            setVotingId(null)
        }
    }

    const hasVoted = (request: RegistrationRequest) => {
        if (!walletAddress) return false
        return request.votes.some(
            (v) => v.voter.toLowerCase() === walletAddress.toLowerCase()
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Microscope className="h-6 w-6 text-chart-3" />
                        Researcher Registration Requests
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Vote on pending researcher registration applications. Majority approval required.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRequests}
                    disabled={loading}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : requests.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-foreground">No Pending Requests</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        There are no researcher registration requests awaiting approval.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((req) => {
                        const voted = hasVoted(req)
                        const approveCount = req.votes.filter((v) => v.approve).length
                        const rejectCount = req.votes.filter((v) => !v.approve).length
                        const isExpired = new Date(req.expiresAt) < new Date()

                        return (
                            <div
                                key={req._id}
                                className="rounded-xl border border-border/50 bg-card p-6 space-y-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {req.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {req.email}
                                            </span>
                                            {req.institution && (
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {req.institution}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Wallet className="h-3 w-3" />
                                                {req.applicantAddress.slice(0, 6)}...{req.applicantAddress.slice(-4)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 border border-amber-500/20">
                                            <Clock className="h-3 w-3" />
                                            Proposal #{req.proposalId}
                                        </span>
                                    </div>
                                </div>

                                {/* Vote counts */}
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <ThumbsUp className="h-4 w-4 text-emerald-500" />
                                        <span className="text-foreground font-medium">{approveCount}</span>
                                        <span className="text-muted-foreground">approvals</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <ThumbsDown className="h-4 w-4 text-red-500" />
                                        <span className="text-foreground font-medium">{rejectCount}</span>
                                        <span className="text-muted-foreground">rejections</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Expires: {new Date(req.expiresAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Actions */}
                                {voted ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        You have already voted on this request
                                    </div>
                                ) : isExpired ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <XCircle className="h-4 w-4 text-destructive" />
                                        Voting period has expired
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            size="sm"
                                            onClick={() => handleVote(req.proposalId, true)}
                                            disabled={!!votingId}
                                            className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
                                        >
                                            {votingId === `${req.proposalId}-approve` ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ThumbsUp className="h-4 w-4" />
                                            )}
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleVote(req.proposalId, false)}
                                            disabled={!!votingId}
                                            className="border-red-500/30 text-red-500 hover:bg-red-500/10 gap-2"
                                        >
                                            {votingId === `${req.proposalId}-reject` ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ThumbsDown className="h-4 w-4" />
                                            )}
                                            Reject
                                        </Button>
                                    </div>
                                )}

                                {/* On-chain TX link */}
                                <div className="text-xs text-muted-foreground">
                                    Proposal TX: <code className="bg-secondary px-1 py-0.5 rounded">{req.txHash.slice(0, 16)}...</code>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
