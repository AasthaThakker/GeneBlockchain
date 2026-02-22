import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  Verified: "bg-success/15 text-success border-success/30",
  Active: "bg-success/15 text-success border-success/30",
  Registered: "bg-primary/15 text-primary border-primary/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Revoked: "bg-destructive/15 text-destructive border-destructive/30",
  Expired: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
  Available: "bg-success/15 text-success border-success/30",
  "Consent Required": "bg-warning/15 text-warning border-warning/30",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground border-border"
      )}
    >
      {status}
    </span>
  )
}
