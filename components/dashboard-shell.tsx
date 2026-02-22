"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Shield,
  LayoutDashboard,
  FileText,
  Clock,
  ShieldCheck,
  ScrollText,
  Download,
  Settings,
  Upload,
  CheckCircle2,
  Search,
  KeyRound,
  History,
  LogOut,
  Wallet,
  Wifi,
  Users,
  type LucideIcon,
} from "lucide-react"
import { type ReactNode, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navMap: Record<NonNullable<UserRole>, NavItem[]> = {
  patient: [
    { label: "Dashboard", href: "/patient", icon: LayoutDashboard },
    { label: "Genomic Records", href: "/patient/records", icon: FileText },
    { label: "Pending Requests", href: "/patient/requests", icon: Clock },
    { label: "Active Consents", href: "/patient/consents", icon: ShieldCheck },
    { label: "Audit Logs", href: "/patient/audit", icon: ScrollText },
    { label: "Download Records", href: "/patient/download", icon: Download },
    { label: "Settings", href: "/patient/settings", icon: Settings },
  ],
  lab: [
    { label: "Dashboard", href: "/lab", icon: LayoutDashboard },
    { label: "Upload VCF/FASTA", href: "/lab/upload", icon: Upload },
    { label: "Registered Records", href: "/lab/records", icon: FileText },
    { label: "Integrity Check", href: "/lab/integrity", icon: CheckCircle2 },
    { label: "Audit Logs", href: "/lab/audit", icon: ScrollText },
    { label: "Team Management", href: "/lab/team", icon: Users },
  ],
  researcher: [
    { label: "Dashboard", href: "/researcher", icon: LayoutDashboard },
    { label: "Search Metadata", href: "/researcher/search", icon: Search },
    { label: "My Requests", href: "/researcher/requests", icon: KeyRound },
    { label: "Active Permissions", href: "/researcher/permissions", icon: ShieldCheck },
    { label: "Audit History", href: "/researcher/audit", icon: History },
    { label: "Team Management", href: "/researcher/team", icon: Users },
  ],
}

const roleLabels: Record<NonNullable<UserRole>, string> = {
  patient: "Patient Portal",
  lab: "Lab / Pharmacy",
  researcher: "Research Portal",
}

export function DashboardShell({
  children,
  role,
  title,
}: {
  children: ReactNode
  role: NonNullable<UserRole>
  title?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { walletAddress, logout, isConnected } = useAuth()

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const navItems = navMap[role]
  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : ""

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border/50 bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20">
            <Shield className="h-4 w-4 text-sidebar-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-sidebar-foreground">GenShare</div>
            <div className="text-xs text-muted-foreground">{roleLabels[role]}</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-border p-4">
          {/* Network Status */}
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2">
            <Wifi className="h-3.5 w-3.5 text-success" />
            <span className="text-xs text-sidebar-foreground/70">Sepolia Testnet</span>
          </div>

          {/* Wallet */}
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2">
            <Wallet className="h-3.5 w-3.5 text-sidebar-primary" />
            <span className="font-mono text-xs text-sidebar-foreground/70">{truncatedWallet}</span>
          </div>

          {/* Theme Toggle */}
          <div className="mb-3 flex items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2">
            <span className="text-xs text-sidebar-foreground/70">Theme</span>
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout()
              router.push("/")
            }}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <div className="p-8">
          {title && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
