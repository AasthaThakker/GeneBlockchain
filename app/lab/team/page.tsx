"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Pencil, Trash2, Shield, User, X } from "lucide-react"

interface LabMember {
    _id: string
    displayName: string
    email: string
    walletAddress: string
    labId: string
    isAdmin: boolean
    createdAt: string
}

export default function LabTeamPage() {
    const { labId, isAdmin } = useAuth()
    const [members, setMembers] = useState<LabMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form state
    const [formName, setFormName] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formPassword, setFormPassword] = useState("")
    const [formWallet, setFormWallet] = useState("")

    const fetchMembers = async () => {
        if (!labId) {
            setLoading(false)
            return
        }
        try {
            const res = await fetch(`/api/lab-members?labId=${labId}`)
            const data = await res.json()
            setMembers(data.data || [])
        } catch {
            setError("Failed to load team members")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchMembers() }, [labId])

    const clearForm = () => {
        setFormName(""); setFormEmail(""); setFormPassword(""); setFormWallet("")
        setShowAddForm(false); setEditingId(null)
        setError(null); setSuccess(null)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            const res = await fetch("/api/lab-members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    labId,
                    adminLabId: labId,
                    displayName: formName,
                    email: formEmail,
                    password: formPassword,
                    walletAddress: formWallet || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess("Member added successfully")
            clearForm()
            fetchMembers()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add member")
        }
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            const res = await fetch("/api/lab-members", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: editingId,
                    adminLabId: labId,
                    displayName: formName || undefined,
                    email: formEmail || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess("Member updated successfully")
            clearForm()
            fetchMembers()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update member")
        }
    }

    const handleDelete = async (userId: string, name: string) => {
        if (!confirm(`Remove ${name} from the lab?`)) return
        setError(null)
        try {
            const res = await fetch(`/api/lab-members?userId=${userId}&adminLabId=${labId}`, { method: "DELETE" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess("Member removed")
            fetchMembers()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove member")
        }
    }

    const startEdit = (member: LabMember) => {
        setEditingId(member._id)
        setFormName(member.displayName || "")
        setFormEmail(member.email || "")
        setShowAddForm(false)
    }

    if (loading) {
        return (
            <DashboardShell role="lab">
                <div className="flex items-center justify-center py-20 text-muted-foreground">Loading team...</div>
            </DashboardShell>
        )
    }

    if (!labId) {
        return (
            <DashboardShell role="lab">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-yellow-500/10 p-3 text-yellow-500">
                        <Shield className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">No Lab Profile Found</h2>
                    <p className="mt-2 text-muted-foreground">
                        Your account is not associated with any lab. <br />
                        Please contact an admin to be added to a team.
                    </p>
                </div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell role="lab">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
                    <p className="text-sm text-muted-foreground">Manage lab members for {labId}</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => { clearForm(); setShowAddForm(true) }} className="gap-2">
                        <UserPlus className="h-4 w-4" /> Add Member
                    </Button>
                )}
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                    {success}
                </div>
            )}

            {/* Add / Edit Form */}
            {(showAddForm || editingId) && isAdmin && (
                <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                            {editingId ? "Edit Member" : "Add New Member"}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={clearForm}><X className="h-4 w-4" /></Button>
                    </div>
                    <form onSubmit={editingId ? handleEdit : handleAdd} className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. John Smith" required={!editingId} />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="john@lab.com" required={!editingId} />
                        </div>
                        {!editingId && (
                            <>
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Min 6 characters" required />
                                </div>
                                <div>
                                    <Label htmlFor="wallet">Wallet Address (optional)</Label>
                                    <Input id="wallet" value={formWallet} onChange={e => setFormWallet(e.target.value)} placeholder="0x..." />
                                </div>
                            </>
                        )}
                        <div className="sm:col-span-2">
                            <Button type="submit" className="gap-2">
                                {editingId ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                {editingId ? "Save Changes" : "Add Member"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Members Table */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50 bg-secondary/50">
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Wallet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Joined</th>
                            {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {members.map(m => (
                            <tr key={m._id} className="transition-colors hover:bg-secondary/30">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {m.isAdmin ? <Shield className="h-4 w-4 text-yellow-500" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                        <span className="text-sm font-medium text-foreground">{m.displayName || "—"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{m.email}</td>
                                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                    {m.walletAddress ? `${m.walletAddress.slice(0, 6)}...${m.walletAddress.slice(-4)}` : "—"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${m.isAdmin ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 text-primary"}`}>
                                        {m.isAdmin ? "Admin" : "Member"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                    {new Date(m.createdAt).toLocaleDateString()}
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4">
                                        {!m.isAdmin && (
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(m)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(m._id, m.displayName)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                    No team members found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardShell>
    )
}
