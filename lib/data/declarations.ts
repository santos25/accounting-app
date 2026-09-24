import "server-only"

import { requireUser } from "@/lib/auth"
import { CLOSED_STATUSES, type DeclarationStatus, type PaymentStatus, type Urgency } from "@/lib/domain"
import type { Tables } from "@/lib/supabase/database.types"

type OverviewRow = Tables<"declarations_overview">

/** Fila de la vista con los campos no nulos que garantiza el join. */
export type DeclarationRow = {
  [K in keyof OverviewRow]-?: NonNullable<OverviewRow[K]>
} & {
  filed_at: string | null
  form_number: string | null
  notes: string | null
}

export type DeclarationFilters = {
  taxYear: number
  statuses?: DeclarationStatus[]
  payment?: PaymentStatus
  urgency?: Exclude<Urgency, "done">
  search?: string
}

const CLOSED_LIST = `(${CLOSED_STATUSES.join(",")})`

function sanitizeSearch(term: string) {
  return term.replace(/[,()%*\\]/g, " ").trim()
}

export async function listDeclarations(filters: DeclarationFilters) {
  const { supabase } = await requireUser()
  let query = supabase
    .from("declarations_overview")
    .select("*")
    .eq("tax_year", filters.taxYear)
    .order("due_date", { ascending: true })
    .order("full_name", { ascending: true })

  if (filters.statuses?.length) query = query.in("status", filters.statuses)
  if (filters.payment) query = query.eq("payment_status", filters.payment)

  if (filters.urgency) {
    query = query.not("status", "in", CLOSED_LIST)
    if (filters.urgency === "overdue") query = query.lt("days_left", 0)
    if (filters.urgency === "critical") query = query.gte("days_left", 0).lte("days_left", 7)
    if (filters.urgency === "soon") query = query.gte("days_left", 8).lte("days_left", 15)
    if (filters.urgency === "ok") query = query.gt("days_left", 15)
  }

  const term = filters.search ? sanitizeSearch(filters.search) : ""
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,document_number.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(`No se pudieron cargar las declaraciones: ${error.message}`)
  return data as DeclarationRow[]
}

export async function listDeclarationsForClient(clientId: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("declarations_overview")
    .select("*")
    .eq("client_id", clientId)
    .order("tax_year", { ascending: false })
  if (error) throw new Error(`No se pudieron cargar las declaraciones: ${error.message}`)
  return data as DeclarationRow[]
}

/** Años gravables con datos, del más reciente al más antiguo. */
export async function listTaxYears() {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from("declarations").select("tax_year")
  if (error) throw new Error(error.message)
  return [...new Set(data.map((d) => d.tax_year))].sort((a, b) => b - a)
}

/** Año gravable por defecto: el anterior al año en curso (en 2026 se declara 2025). */
export function defaultTaxYear(available: number[]) {
  const previous = new Date().getFullYear() - 1
  if (available.length === 0 || available.includes(previous)) return previous
  return available[0]
}

export async function suggestDueDate(taxYear: number, lastDigits: string) {
  const { supabase } = await requireUser()
  const { data } = await supabase
    .from("tax_calendar")
    .select("due_date")
    .eq("tax_year", taxYear)
    .eq("last_digits", lastDigits)
    .maybeSingle()
  return data?.due_date ?? null
}
