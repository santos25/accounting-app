import {
  AlarmClockIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CircleAlertIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getUrgency, type DeclarationStatus, type Urgency } from "@/lib/domain"

export const URGENCY_TEXT_CLASS: Record<Urgency, string> = {
  overdue: "text-urgency-overdue",
  critical: "text-urgency-critical",
  soon: "text-urgency-soon",
  ok: "text-urgency-ok",
  done: "text-muted-foreground",
}

/** Borde izquierdo de 3 px para filas de tabla. */
export const URGENCY_BORDER_CLASS: Record<Urgency, string> = {
  overdue: "border-l-urgency-overdue",
  critical: "border-l-urgency-critical",
  soon: "border-l-urgency-soon",
  ok: "border-l-transparent",
  done: "border-l-transparent",
}

const URGENCY_ICON: Record<Urgency, LucideIcon> = {
  overdue: CircleAlertIcon,
  critical: AlarmClockIcon,
  soon: CalendarClockIcon,
  ok: CalendarClockIcon,
  done: CalendarCheckIcon,
}

function describe(daysLeft: number, urgency: Urgency) {
  if (urgency === "done") return "Cerrada"
  if (daysLeft === 0) return "Vence hoy"
  if (daysLeft === 1) return "Vence mañana"
  if (daysLeft > 0) return `Vence en ${daysLeft} días`
  if (daysLeft === -1) return "Venció ayer"
  return `Vencida hace ${Math.abs(daysLeft)} días`
}

export function UrgencyIndicator({
  daysLeft,
  status,
  className,
}: {
  daysLeft: number
  status: DeclarationStatus
  className?: string
}) {
  const urgency = getUrgency(daysLeft, status)
  const Icon = URGENCY_ICON[urgency]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap tabular-nums",
        URGENCY_TEXT_CLASS[urgency],
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {describe(daysLeft, urgency)}
    </span>
  )
}
