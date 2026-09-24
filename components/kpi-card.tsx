import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: LucideIcon
  tone?: "default" | "overdue" | "critical"
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon
          aria-hidden
          className={cn(
            "size-4 text-muted-foreground",
            tone === "overdue" && "text-urgency-overdue",
            tone === "critical" && "text-urgency-critical"
          )}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  )
}
