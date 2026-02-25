"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Shield,
  Lock,
  ArrowRight,
  FlaskConical,
  Microscope,
  Wallet,
  Dna,
  UserPlus,
  CheckCircle2,
  Clock,
} from "lucide-react"

type LabView = "buttons" | "login" | "register"
type ResearcherView = "buttons" | "login" | "register"

export function LandingPage() {
  const router = useRouter()
  const { connectWallet, loginWithEmail } = useAuth()

  // Lab state
  const [labView, setLabView] = useState<LabView>("buttons")
  const [labEmail, setLabEmail] = useState("")
  const [labPassword, setLabPassword] = useState("")

  // Lab registration state
  const [labRegName, setLabRegName] = useState("")
  const [labRegEmail, setLabRegEmail] = useState("")
  const [labRegPassword, setLabRegPassword] = useState("")
  const [labRegWallet, setLabRegWallet] = useState("")

  // Researcher state
  const [resView, setResView] = useState<ResearcherView>("buttons")
  const [resEmail, setResEmail] = useState("")
  const [resPassword, setResPassword] = useState("")

  // Researcher registration state
  const [resRegName, setResRegName] = useState("")
  const [resRegEmail, setResRegEmail] = useState("")
  const [resRegPassword, setResRegPassword] = useState("")
  const [resRegWallet, setResRegWallet] = useState("")
  const [resRegInstitution, setResRegInstitution] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handlePatientConnect = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await connectWallet("patient")
      router.push("/patient")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setLoading(false)
    }
  }

  const handleLabMetaMask = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await connectWallet("lab")
      router.push("/lab")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setLoading(false)
    }
  }

  const handleLabLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await loginWithEmail(labEmail, labPassword, "lab")
      router.push("/lab")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  const handleResearcherMetaMask = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await connectWallet("researcher")
      router.push("/researcher")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setLoading(false)
    }
  }

  const handleResearcherLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await loginWithEmail(resEmail, resPassword, "researcher")
      router.push("/researcher")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  const connectWalletForRegistration = async (setter: (addr: string) => void) => {
    if (typeof window === "undefined" || !(window as unknown as Record<string, unknown>).ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to continue.")
      return
    }
    try {
      const ethereum = (window as unknown as Record<string, unknown>).ethereum as {
        request: (args: { method: string }) => Promise<string[]>
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      if (accounts[0]) {
        setter(accounts[0])
      }
    } catch {
      setError("Failed to connect wallet")
    }
  }

  const handleLabRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    // Basic address validation
    if (!labRegWallet || !labRegWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Please provide a valid Ethereum wallet address (0x...)")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: labRegName,
          email: labRegEmail,
          password: labRegPassword,
          role: "LAB",
          walletAddress: labRegWallet,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setSuccessMessage(data.message)
      // Reset form
      setLabRegName("")
      setLabRegEmail("")
      setLabRegPassword("")
      setLabRegWallet("")
      if (data.autoApproved) {
        setTimeout(() => {
          setLabView("login")
          setSuccessMessage(null)
        }, 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResearcherRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    // Basic address validation
    if (!resRegWallet || !resRegWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Please provide a valid Ethereum wallet address (0x...)")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resRegName,
          email: resRegEmail,
          password: resRegPassword,
          role: "RESEARCHER",
          walletAddress: resRegWallet,
          institution: resRegInstitution,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setSuccessMessage(data.message)
      // Reset form
      setResRegName("")
      setResRegEmail("")
      setResRegPassword("")
      setResRegWallet("")
      setResRegInstitution("")
      if (data.autoApproved) {
        setTimeout(() => {
          setResView("login")
          setSuccessMessage(null)
        }, 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
              <Dna className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold">GenShare</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <nav className="hidden md:flex items-center gap-6">
              <a href="/features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </a>
              <a href="/explorer" className="text-sm font-medium hover:text-primary transition-colors">
                Explorer
              </a>
              <a href="#roles" className="text-sm font-medium hover:text-primary transition-colors">
                Access Portal
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.15)_0%,_transparent_50%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Blockchain Secured</span>
          </div>

          <h1 className="max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            Decentralized Genomic Data Sharing with{" "}
            <span className="text-primary">Dynamic Consent</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            GenShare enables secure, auditable, and consent-driven exchange of genomic datasets
            between patients, laboratories, and researchers using blockchain smart contracts.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={handlePatientConnect}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet (Patient)
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const el = document.getElementById("roles")
                el?.scrollIntoView({ behavior: "smooth" })
              }}
              className="gap-2 border-border text-foreground hover:bg-secondary"
            >
              Access Portal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* DNA Image */}
          <div className="relative mt-16 w-full max-w-2xl">
            <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-3xl" />
            <img
              src="/images/dna-helix.jpg"
              alt="DNA double helix visualization"
              className="relative rounded-xl border border-border/50 shadow-2xl shadow-primary/10"
            />
          </div>
        </div>
      </section>


      {/* Role-Based Access */}
      <section id="roles" className="border-t border-border/50 bg-card/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Access Portal</h2>
            <p className="mt-3 text-muted-foreground">Select your role to access the platform or register as a new member</p>
          </div>

          {error && (
            <div className="mx-auto mt-4 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mx-auto mt-4 max-w-md rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-primary flex items-center justify-center gap-2">
              {successMessage.includes("approved") ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 shrink-0" />
              )}
              {successMessage}
            </div>
          )}

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Patient Card */}
            <div className="rounded-xl border border-border/50 bg-card p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Patient Portal</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Connect your MetaMask wallet to manage consent and view your genomic records.
              </p>
              <Button
                onClick={handlePatientConnect}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect MetaMask
              </Button>
            </div>

            {/* Lab Card */}
            <div className="rounded-xl border border-border/50 bg-card p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/10">
                <FlaskConical className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Lab / Pharmacy</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Login, connect MetaMask, or register as a new lab member.
              </p>
              {labView === "buttons" ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setLabView("login"); setError(null); setSuccessMessage(null) }}
                    className="w-full border-chart-2/30 text-chart-2 hover:bg-chart-2/10"
                  >
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Lab Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLabMetaMask}
                    disabled={loading}
                    className="w-full border-chart-2/30 text-chart-2 hover:bg-chart-2/10"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect MetaMask (Lab)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setLabView("register"); setError(null); setSuccessMessage(null) }}
                    className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register as Lab
                  </Button>
                </div>
              ) : labView === "login" ? (
                <form onSubmit={handleLabLogin} className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="lab-email" className="text-xs text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="lab-email"
                      type="email"
                      placeholder="admin@lab.com"
                      value={labEmail}
                      onChange={(e) => setLabEmail(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lab-pass" className="text-xs text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="lab-pass"
                      type="password"
                      placeholder="Enter password"
                      value={labPassword}
                      onChange={(e) => setLabPassword(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-chart-2 text-background hover:bg-chart-2/90"
                  >
                    {loading ? "Authenticating..." : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLabMetaMask}
                    disabled={loading}
                    className="border-chart-2/30 text-chart-2 hover:bg-chart-2/10"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Or Connect MetaMask
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLabView("buttons")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLabRegister} className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="lab-reg-name" className="text-xs text-muted-foreground">
                      Lab Name
                    </Label>
                    <Input
                      id="lab-reg-name"
                      type="text"
                      placeholder="My Laboratory"
                      value={labRegName}
                      onChange={(e) => setLabRegName(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lab-reg-email" className="text-xs text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="lab-reg-email"
                      type="email"
                      placeholder="admin@lab.com"
                      value={labRegEmail}
                      onChange={(e) => setLabRegEmail(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lab-reg-pass" className="text-xs text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="lab-reg-pass"
                      type="password"
                      placeholder="Create password"
                      value={labRegPassword}
                      onChange={(e) => setLabRegPassword(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lab-reg-wallet" className="text-xs text-muted-foreground">
                      Wallet Address
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="lab-reg-wallet"
                        type="text"
                        placeholder="0x..."
                        value={labRegWallet}
                        onChange={(e) => setLabRegWallet(e.target.value)}
                        className="border-border bg-secondary text-foreground flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => connectWalletForRegistration(setLabRegWallet)}
                        className="border-chart-2/30 text-chart-2 hover:bg-chart-2/10 shrink-0 text-xs"
                      >
                        <Wallet className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {loading ? "Submitting..." : "Register as Lab"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Registration requires majority vote approval from existing lab members via blockchain
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLabView("buttons")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </Button>
                </form>
              )}
            </div>

            {/* Researcher Card */}
            <div className="rounded-xl border border-border/50 bg-card p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10">
                <Microscope className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Research Portal</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Login, connect MetaMask, or register as a new researcher.
              </p>
              {resView === "buttons" ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setResView("login"); setError(null); setSuccessMessage(null) }}
                    className="w-full border-chart-3/30 text-chart-3 hover:bg-chart-3/10"
                  >
                    <Microscope className="mr-2 h-4 w-4" />
                    Researcher Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResearcherMetaMask}
                    disabled={loading}
                    className="w-full border-chart-3/30 text-chart-3 hover:bg-chart-3/10"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect MetaMask (Researcher)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setResView("register"); setError(null); setSuccessMessage(null) }}
                    className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register as Researcher
                  </Button>
                </div>
              ) : resView === "login" ? (
                <form onSubmit={handleResearcherLogin} className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="res-email" className="text-xs text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="res-email"
                      type="email"
                      placeholder="researcher@uni.edu"
                      value={resEmail}
                      onChange={(e) => setResEmail(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="res-pass" className="text-xs text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="res-pass"
                      type="password"
                      placeholder="Enter password"
                      value={resPassword}
                      onChange={(e) => setResPassword(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-chart-3 text-foreground hover:bg-chart-3/90"
                  >
                    {loading ? "Authenticating..." : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResearcherMetaMask}
                    disabled={loading}
                    className="border-chart-3/30 text-chart-3 hover:bg-chart-3/10"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Or Connect MetaMask
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setResView("buttons")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResearcherRegister} className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="res-reg-name" className="text-xs text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="res-reg-name"
                      type="text"
                      placeholder="Dr. Jane Smith"
                      value={resRegName}
                      onChange={(e) => setResRegName(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="res-reg-institution" className="text-xs text-muted-foreground">
                      Institution
                    </Label>
                    <Input
                      id="res-reg-institution"
                      type="text"
                      placeholder="MIT, Stanford, etc."
                      value={resRegInstitution}
                      onChange={(e) => setResRegInstitution(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="res-reg-email" className="text-xs text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="res-reg-email"
                      type="email"
                      placeholder="researcher@uni.edu"
                      value={resRegEmail}
                      onChange={(e) => setResRegEmail(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="res-reg-pass" className="text-xs text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="res-reg-pass"
                      type="password"
                      placeholder="Create password"
                      value={resRegPassword}
                      onChange={(e) => setResRegPassword(e.target.value)}
                      className="mt-1 border-border bg-secondary text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="res-reg-wallet" className="text-xs text-muted-foreground">
                      Wallet Address
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="res-reg-wallet"
                        type="text"
                        placeholder="0x..."
                        value={resRegWallet}
                        onChange={(e) => setResRegWallet(e.target.value)}
                        className="border-border bg-secondary text-foreground flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => connectWalletForRegistration(setResRegWallet)}
                        className="border-chart-3/30 text-chart-3 hover:bg-chart-3/10 shrink-0 text-xs"
                      >
                        <Wallet className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {loading ? "Submitting..." : "Register as Researcher"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Registration requires majority vote approval from existing researchers via blockchain
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setResView("buttons")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>



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
            Ethereum Hardhat Local Network | IPFS Off-Chain Storage | HIPAA/GDPR Aligned
          </p>
        </div>
      </footer>
    </div>
  )
}
