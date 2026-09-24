import type { Enums } from "@/lib/supabase/database.types"

export type DeclarationStatus = Enums<"declaration_status">
export type PaymentStatus = Enums<"payment_status">
export type DocumentType = Enums<"document_type">

export const DECLARATION_STATUSES = [
  "PENDIENTE",
  "DOCUMENTOS_RECIBIDOS",
  "EN_PROCESO",
  "PRESENTADA",
  "NO_OBLIGADO",
] as const satisfies readonly DeclarationStatus[]

export const DECLARATION_STATUS_LABEL: Record<DeclarationStatus, string> = {
  PENDIENTE: "Pendiente",
  DOCUMENTOS_RECIBIDOS: "Documentos recibidos",
  EN_PROCESO: "En proceso",
  PRESENTADA: "Presentada",
  NO_OBLIGADO: "No obligado",
}

/** Estados en los que la declaración ya no requiere acción ante la DIAN. */
export const CLOSED_STATUSES: readonly DeclarationStatus[] = ["PRESENTADA", "NO_OBLIGADO"]

export const PAYMENT_STATUSES = [
  "PENDIENTE",
  "PARCIAL",
  "PAGADO",
] as const satisfies readonly PaymentStatus[]

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDIENTE: "Sin pago",
  PARCIAL: "Abono parcial",
  PAGADO: "Pagado",
}

export const DOCUMENT_TYPES = [
  "CC",
  "CE",
  "NIT",
  "PASAPORTE",
] as const satisfies readonly DocumentType[]

export type Urgency = "overdue" | "critical" | "soon" | "ok" | "done"

export const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Vencida",
  critical: "7 días o menos",
  soon: "15 días o menos",
  ok: "A tiempo",
  done: "Cerrada",
}

export function getUrgency(daysLeft: number, status: DeclarationStatus): Urgency {
  if (CLOSED_STATUSES.includes(status)) return "done"
  if (daysLeft < 0) return "overdue"
  if (daysLeft <= 7) return "critical"
  if (daysLeft <= 15) return "soon"
  return "ok"
}

/** Los dos últimos dígitos del documento, que definen el vencimiento en el calendario DIAN. */
export function lastTwoDigits(documentNumber: string) {
  const digits = documentNumber.replace(/\D/g, "")
  return digits.slice(-2).padStart(2, "0")
}
