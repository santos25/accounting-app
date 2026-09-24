"use client"

import { useActionState, useMemo } from "react"
import { Loader2Icon } from "lucide-react"
import { createClientAction, updateClientAction } from "@/app/(dashboard)/clientes/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import type { ClientDetail } from "@/lib/data/clients"
import { DOCUMENT_TYPES } from "@/lib/domain"
import type { ActionState } from "@/lib/validation"
import { fieldError, useActionFeedback } from "./form-feedback"

const initialState: ActionState = {}

export function ClientForm({
  client,
  onSuccess,
}: {
  client?: ClientDetail
  onSuccess?: () => void
}) {
  const action = useMemo(
    () => (client ? updateClientAction.bind(null, client.id) : createClientAction),
    [client]
  )
  const [state, formAction, pending] = useActionState(action, initialState)
  useActionFeedback(state, onSuccess)
  const isEdit = Boolean(client)

  const err = (name: string) => fieldError(state, name)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend variant="label">Datos del cliente</FieldLegend>
        <FieldGroup>
          <Field data-invalid={Boolean(err("full_name")) || undefined}>
            <FieldLabel htmlFor="full_name">Nombre completo</FieldLabel>
            <Input id="full_name" name="full_name" defaultValue={client?.full_name} required />
            <FieldError>{err("full_name")}</FieldError>
          </Field>
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <Field>
              <FieldLabel htmlFor="document_type">Tipo</FieldLabel>
              <Select name="document_type" defaultValue={client?.document_type ?? "CC"}>
                <SelectTrigger id="document_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={Boolean(err("document_number")) || undefined}>
              <FieldLabel htmlFor="document_number">Número de documento</FieldLabel>
              <Input
                id="document_number"
                name="document_number"
                inputMode="numeric"
                className="font-mono"
                defaultValue={client?.document_number}
                required
              />
              <FieldError>{err("document_number")}</FieldError>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={Boolean(err("email")) || undefined}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
              <FieldError>{err("email")}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Teléfono / WhatsApp</FieldLabel>
              <Input id="phone" name="phone" type="tel" defaultValue={client?.phone ?? ""} />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Credenciales DIAN</FieldLegend>
        <FieldDescription>
          Se guardan cifradas.{" "}
          {isEdit ? "Déjalas en blanco para conservar las actuales." : null}
        </FieldDescription>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="portal_password">Contraseña</FieldLabel>
              <Input
                id="portal_password"
                name="portal_password"
                type="password"
                autoComplete="new-password"
                className="font-mono"
                placeholder={client?.has_portal_password ? "•••••••• (guardada)" : ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="e_signature">Firma electrónica</FieldLabel>
              <Input
                id="e_signature"
                name="e_signature"
                type="password"
                autoComplete="new-password"
                className="font-mono"
                placeholder={client?.has_e_signature ? "•••••••• (guardada)" : ""}
              />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      <Field>
        <FieldLabel htmlFor="notes">Notas</FieldLabel>
        <Textarea id="notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} />
      </Field>

      {isEdit ? (
        <Field orientation="horizontal">
          <input
            id="active"
            name="active"
            type="checkbox"
            defaultChecked={client?.active}
            className="size-4 accent-primary"
          />
          <FieldLabel htmlFor="active" className="font-normal">
            Cliente activo
          </FieldLabel>
        </Field>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {isEdit ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  )
}
