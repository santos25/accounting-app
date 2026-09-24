import {
  DECLARATION_STATUSES,
  PAYMENT_STATUSES,
  type DeclarationStatus,
  type PaymentStatus,
} from "@/lib/domain"
import type { DeclarationFilters } from "@/lib/data/declarations"

type RawParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export function parseDeclarationFilters(
  params: RawParams,
  fallbackYear: number
): DeclarationFilters {
  const year = Number(first(params.year))
  const status = first(params.status)
  const payment = first(params.payment)
  const urgency = first(params.urgency)

  return {
    taxYear: Number.isInteger(year) && year > 2000 ? year : fallbackYear,
    statuses:
      status && DECLARATION_STATUSES.includes(status as DeclarationStatus)
        ? [status as DeclarationStatus]
        : undefined,
    payment:
      payment && PAYMENT_STATUSES.includes(payment as PaymentStatus)
        ? (payment as PaymentStatus)
        : undefined,
    urgency:
      urgency === "overdue" || urgency === "critical" || urgency === "soon" || urgency === "ok"
        ? urgency
        : undefined,
    search: first(params.q)?.slice(0, 80),
  }
}
