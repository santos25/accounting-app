"use client"

import { useActionState } from "react"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn, type LoginState } from "./actions"

const initialState: LoginState = {}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next ?? ""} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Correo</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
            required
          />
        </Field>
        <Field data-invalid={Boolean(state.error) || undefined}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(state.error) || undefined}
            required
          />
          {state.error ? <FieldError>{state.error}</FieldError> : null}
        </Field>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Ingresar
        </Button>
      </FieldGroup>
    </form>
  )
}
