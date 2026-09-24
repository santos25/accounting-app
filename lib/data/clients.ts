import "server-only"

import { requireUser } from "@/lib/auth"

const CLIENT_PUBLIC_COLUMNS =
  "id, full_name, document_type, document_number, email, phone, notes, active, created_at, updated_at, portal_password_enc, e_signature_enc"

export type ClientSummary = {
  id: string
  full_name: string
  document_number: string
}

export async function listClientSummaries(): Promise<ClientSummary[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, document_number")
    .eq("active", true)
    .order("full_name")
  if (error) throw new Error(`No se pudieron cargar los clientes: ${error.message}`)
  return data
}

export async function listClients() {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("clients")
    .select(`${CLIENT_PUBLIC_COLUMNS}, declarations(tax_year, status, due_date)`)
    .order("full_name")
  if (error) throw new Error(`No se pudieron cargar los clientes: ${error.message}`)
  return data.map(({ portal_password_enc, e_signature_enc, ...c }) => ({
    ...c,
    has_portal_password: Boolean(portal_password_enc),
    has_e_signature: Boolean(e_signature_enc),
  }))
}

export type ClientListItem = Awaited<ReturnType<typeof listClients>>[number]

/** Detalle sin credenciales: solo indica si existen. Se descifran bajo demanda. */
export async function getClient(id: string) {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const { portal_password_enc, e_signature_enc, ...client } = data
  return {
    ...client,
    has_portal_password: Boolean(portal_password_enc),
    has_e_signature: Boolean(e_signature_enc),
  }
}

export type ClientDetail = NonNullable<Awaited<ReturnType<typeof getClient>>>
