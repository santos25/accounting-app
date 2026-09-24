import { z } from "zod"
import { DECLARATION_STATUSES, DOCUMENT_TYPES } from "@/lib/domain"

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null)

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")

/** Acepta "180000", "180.000", "$ 180.000" -> 180000 (pesos sin decimales). */
const money = z
  .string()
  .trim()
  .transform((v) => Number(v.replace(/[^\d]/g, "") || "0"))
  .pipe(z.number().int().min(0, "Valor no válido"))

export const clientSchema = z.object({
  full_name: z.string().trim().min(1, "Ingresa el nombre"),
  document_type: z.enum(DOCUMENT_TYPES),
  document_number: z
    .string()
    .trim()
    .min(3, "Documento no válido")
    .regex(/^[0-9A-Za-z.-]+$/, "Solo números, letras, puntos o guiones")
    .transform((v) => v.replace(/[.\s]/g, "")),
  email: z
    .union([z.literal(""), z.email("Correo no válido")])
    .optional()
    .transform((v) => (v ? v : null)),
  phone: optionalText,
  notes: optionalText,
  active: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  // En edición, vacío significa "conservar la actual".
  portal_password: z.string().optional(),
  e_signature: z.string().optional(),
})

export const declarationSchema = z.object({
  client_id: z.uuid("Selecciona un cliente"),
  tax_year: z.coerce.number().int().min(2000).max(2100),
  due_date: z.union([z.literal(""), isoDate]).optional(),
  status: z.enum(DECLARATION_STATUSES),
  fee: money,
  amount_paid: money,
  filed_at: z.union([z.literal(""), isoDate]).optional(),
  form_number: optionalText,
  notes: optionalText,
})

export type ActionState = {
  ok?: boolean
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export function toFieldErrors(error: z.ZodError): ActionState {
  return {
    ok: false,
    message: "Revisa los campos marcados",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  }
}
