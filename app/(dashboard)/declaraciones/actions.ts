"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { suggestDueDate } from "@/lib/data/declarations"
import { DECLARATION_STATUSES, lastTwoDigits, type DeclarationStatus } from "@/lib/domain"
import { declarationSchema, toFieldErrors, type ActionState } from "@/lib/validation"

export async function saveDeclarationAction(
  id: string | null,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await requireUser()
  const parsed = declarationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return toFieldErrors(parsed.error)
  const input = parsed.data

  let dueDate = input.due_date || null
  if (!dueDate) {
    const { data: client } = await supabase
      .from("clients")
      .select("document_number")
      .eq("id", input.client_id)
      .maybeSingle()
    if (client) {
      dueDate = await suggestDueDate(input.tax_year, lastTwoDigits(client.document_number))
    }
    if (!dueDate) {
      return {
        ok: false,
        message: `No hay calendario DIAN cargado para ${input.tax_year}; ingresa la fecha manualmente`,
        fieldErrors: { due_date: ["Ingresa la fecha de vencimiento"] },
      }
    }
  }

  let filedAt: string | null = input.filed_at || null
  if (input.status === "PRESENTADA" && !filedAt) filedAt = new Date().toISOString()
  if (input.status !== "PRESENTADA") filedAt = null

  const values = {
    client_id: input.client_id,
    tax_year: input.tax_year,
    due_date: dueDate,
    status: input.status,
    fee: input.fee,
    amount_paid: input.amount_paid,
    filed_at: filedAt,
    form_number: input.form_number,
    notes: input.notes,
  }

  const { error } = id
    ? await supabase.from("declarations").update(values).eq("id", id)
    : await supabase.from("declarations").insert(values)

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: `Este cliente ya tiene una declaración para el año gravable ${input.tax_year}`,
        fieldErrors: { tax_year: ["Año ya registrado para este cliente"] },
      }
    }
    return { ok: false, message: error.message }
  }

  revalidatePath("/", "layout")
  return { ok: true, message: id ? "Declaración actualizada" : "Declaración creada" }
}

export async function updateDeclarationStatusAction(id: string, status: DeclarationStatus) {
  if (!DECLARATION_STATUSES.includes(status)) throw new Error("Estado no válido")
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("declarations")
    .update({ status, filed_at: status === "PRESENTADA" ? new Date().toISOString() : null })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}

export async function deleteDeclarationAction(id: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("declarations").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
