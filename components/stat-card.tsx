import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
