import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export const TIME_ZONE = "America/Bogota"

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

export function formatCOP(value: number | string | null | undefined) {
  return copFormatter.format(Number(value ?? 0))
}

/** Fecha de hoy en Colombia como "YYYY-MM-DD". */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date())
}

/** "2026-08-19" -> "19 ago 2026" */
export function formatDate(isoDate: string | null | undefined) {
  if (!isoDate) return "—"
  return format(parseISO(isoDate), "d MMM yyyy", { locale: es }).replace(".", "")
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(iso))
}

export function daysUntil(isoDate: string, fromISO = todayISO()) {
  return differenceInCalendarDays(parseISO(isoDate), parseISO(fromISO))
}
