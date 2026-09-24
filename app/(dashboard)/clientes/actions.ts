"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { decrypt, encryptOptional } from "@/lib/crypto"
import type { TablesUpdate } from "@/lib/supabase/database.types"
import { clientSchema, toFieldErrors, type ActionState } from "@/lib/validation"

const DUPLICATE_DOCUMENT: ActionState = {
  ok: false,
  message: "Ya existe un cliente con ese número de documento",
  fieldErrors: { document_number: ["Documento duplicado"] },
}

export async function createClientAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await requireUser()
  const parsed = clientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return toFieldErrors(parsed.error)

  const { portal_password, e_signature, ...client } = parsed.data
  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...client,
      active: true,
      portal_password_enc: encryptOptional(portal_password),
      e_signature_enc: encryptOptional(e_signature),
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") return DUPLICATE_DOCUMENT
    return { ok: false, message: error.message }
  }

  revalidatePath("/", "layout")
  redirect(`/clientes/${data.id}`)
}

export async function updateClientAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await requireUser()
  const parsed = clientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return toFieldErrors(parsed.error)

  const { portal_password, e_signature, ...client } = parsed.data
  const update: TablesUpdate<"clients"> = { ...client }
  // Solo se reemplaza la credencial si el usuario escribió una nueva.
  if (portal_password?.trim()) update.portal_password_enc = encryptOptional(portal_password)
  if (e_signature?.trim()) update.e_signature_enc = encryptOptional(e_signature)

  const { error } = await supabase.from("clients").update(update).eq("id", id)
  if (error) {
    if (error.code === "23505") return DUPLICATE_DOCUMENT
    return { ok: false, message: error.message }
  }

  revalidatePath("/", "layout")
  return { ok: true, message: "Cliente actualizado" }
}

export async function clearCredentialAction(id: string, field: "portal_password" | "e_signature") {
  const { supabase } = await requireUser()
  const update: TablesUpdate<"clients"> =
    field === "portal_password" ? { portal_password_enc: null } : { e_signature_enc: null }
  const { error } = await supabase.from("clients").update(update).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(`/clientes/${id}`)
}

export async function revealCredentialAction(
  id: string,
  field: "portal_password" | "e_signature"
): Promise<string | null> {
  const { supabase } = await requireUser()
  const column = field === "portal_password" ? "portal_password_enc" : "e_signature_enc"
  const { data, error } = await supabase
    .from("clients")
    .select("portal_password_enc, e_signature_enc")
    .eq("id", id)
    .maybeSingle()
  const encrypted = data?.[column]
  if (error || !encrypted) return null
  try {
    return decrypt(encrypted)
  } catch {
    return null
  }
}

export async function deleteClientAction(id: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
