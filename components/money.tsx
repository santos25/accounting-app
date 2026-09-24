import { cn } from "@/lib/utils"
import { formatCOP } from "@/lib/format"

export function Money({
  value,
  className,
  muted = false,
}: {
  value: number | string | null | undefined
  className?: string
  muted?: boolean
}) {
  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        muted && "text-muted-foreground",
        className
      )}
    >
      {formatCOP(value)}
    </span>
  )
}

/** Cobro, abonado y saldo en una celda alineada a la derecha. */
export function MoneyCell({
  fee,
  amountPaid,
}: {
  fee: number
  amountPaid: number
}) {
  const balance = fee - amountPaid
  return (
    <div className="flex flex-col items-end leading-tight">
      <Money value={fee} className="font-medium" />
      {balance > 0 && amountPaid > 0 ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          Saldo {formatCOP(balance)}
        </span>
      ) : null}
    </div>
  )
}
