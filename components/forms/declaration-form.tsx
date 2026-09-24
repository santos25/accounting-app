"use client"

import { useActionState, useMemo, useState } from "react"
import { Loader2Icon } from "lucide-react"
import { saveDeclarationAction } from "@/app/(dashboard)/declaraciones/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ClientSummary } from "@/lib/data/clients"
import type { DeclarationRow } from "@/lib/data/declarations"
import {
  DECLARATION_STATUSES,
  DECLARATION_STATUS_LABEL,
  type DeclarationStatus,
} from "@/lib/domain"
import type { ActionState } from "@/lib/validation"
import { fieldError, useActionFeedback } from "./form-feedback"

const initialState: ActionState = {}

const pesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 })

function formatPesosInput(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits ? pesos.format(Number(digits)) : ""
}

function MoneyInput({
  id,
  name,
  defaultValue,
}: {
  id: string
  name: string
  defaultValue?: number
}) {
  const [value, setValue] = useState(defaultValue ? pesos.format(defaultValue) : "")
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        name={name}
        inputMode="numeric"
        className="pl-6 text-right tabular-nums"
        value={value}
        onChange={(e) => setValue(formatPesosInput(e.target.value))}
        placeholder="0"
      />
    </div>
  )
}

export function DeclarationForm({
  declaration,
  clients,
  clientId,
  taxYear,
  onSuccess,
}: {
  declaration?: DeclarationRow
  /** Lista para elegir cliente; si se pasa clientId fijo no se muestra. */
  clients?: ClientSummary[]
  clientId?: string
  taxYear: number
  onSuccess?: () => void
}) {
  const action = useMemo(
    () => saveDeclarationAction.bind(null, declaration?.id ?? null),
    [declaration?.id]
  )
  const [state, formAction, pending] = useActionState(action, initialState)
  useActionFeedback(state, onSuccess)
  const [status, setStatus] = useState<DeclarationStatus>(declaration?.status ?? "PENDIENTE")

  const err = (name: string) => fieldError(state, name)
  const fixedClientId = declaration?.client_id ?? clientId

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        {fixedClientId ? (
          <input type="hidden" name="client_id" value={fixedClientId} />
        ) : (
          <Field data-invalid={Boolean(err("client_id")) || undefined}>
            <FieldLabel htmlFor="client_id">Cliente</FieldLabel>
            <Select name="client_id" required>
              <SelectTrigger id="client_id" className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.document_number}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{err("client_id")}</FieldError>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={Boolean(err("tax_year")) || undefined}>
            <FieldLabel htmlFor="tax_year">Año gravable</FieldLabel>
            <Input
              id="tax_year"
              name="tax_year"
              type="number"
              min={2000}
              max={2100}
              defaultValue={declaration?.tax_year ?? taxYear}
              required
            />
            <FieldError>{err("tax_year")}</FieldError>
          </Field>
          <Field data-invalid={Boolean(err("due_date")) || undefined}>
            <FieldLabel htmlFor="due_date">Vencimiento</FieldLabel>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              defaultValue={declaration?.due_date ?? ""}
            />
            {err("due_date") ? (
              <FieldError>{err("due_date")}</FieldError>
            ) : (
              <FieldDescription>Vacío: se toma del calendario DIAN.</FieldDescription>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="status">Estado</FieldLabel>
          <Select
            name="status"
            value={status}
            onValueChange={(v) => setStatus(v as DeclarationStatus)}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DECLARATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {DECLARATION_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {status === "PRESENTADA" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="filed_at">Fecha de presentación</FieldLabel>
              <Input
                id="filed_at"
                name="filed_at"
                type="date"
                defaultValue={declaration?.filed_at?.slice(0, 10) ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="form_number">N.º formulario 210</FieldLabel>
              <Input
                id="form_number"
                name="form_number"
                className="font-mono"
                defaultValue={declaration?.form_number ?? ""}
              />
            </Field>
          </div>
        ) : (
          <input type="hidden" name="form_number" value={declaration?.form_number ?? ""} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={Boolean(err("fee")) || undefined}>
            <FieldLabel htmlFor="fee">Cobro</FieldLabel>
            <MoneyInput id="fee" name="fee" defaultValue={declaration?.fee} />
            <FieldError>{err("fee")}</FieldError>
          </Field>
          <Field data-invalid={Boolean(err("amount_paid")) || undefined}>
            <FieldLabel htmlFor="amount_paid">Abonado</FieldLabel>
            <MoneyInput id="amount_paid" name="amount_paid" defaultValue={declaration?.amount_paid} />
            <FieldError>{err("amount_paid")}</FieldError>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="notes">Notas</FieldLabel>
          <Textarea id="notes" name="notes" rows={3} defaultValue={declaration?.notes ?? ""} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {declaration ? "Guardar cambios" : "Crear declaración"}
        </Button>
      </div>
    </form>
  )
}
