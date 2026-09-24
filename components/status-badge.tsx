import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  FileCheckIcon,
  LoaderIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DECLARATION_STATUS_LABEL, type DeclarationStatus } from "@/lib/domain"

const STATUS_STYLE: Record<DeclarationStatus, { icon: LucideIcon; className: string }> = {
  PENDIENTE: {
    icon: CircleDashedIcon,
    className: "bg-status-pendiente/12 text-status-pendiente",
  },
  DOCUMENTOS_RECIBIDOS: {
    icon: FileCheckIcon,
    className: "bg-status-documentos/12 text-status-documentos",
  },
  EN_PROCESO: {
    icon: LoaderIcon,
    className: "bg-status-proceso/12 text-status-proceso",
  },
  PRESENTADA: {
    icon: CircleCheckIcon,
    className: "bg-status-presentada/12 text-status-presentada",
  },
  NO_OBLIGADO: {
    icon: CircleMinusIcon,
    className: "bg-status-no-obligado/12 text-status-no-obligado",
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: DeclarationStatus
  className?: string
}) {
  const { icon: Icon, className: tone } = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        tone,
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {DECLARATION_STATUS_LABEL[status]}
    </span>
  )
}
