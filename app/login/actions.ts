"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export type LoginState = { error?: string; email?: string }

const schema = z.object({
  email: z.email("Correo no válido"),
  password: z.string().min(1, "Ingresa la contraseña"),
  next: z.string().optional(),
})

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/"
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  const email = String(formData.get("email") ?? "")
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, email }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })
  if (error) {
    return { error: "Correo o contraseña incorrectos", email }
  }

  redirect(safeNext(parsed.data.next))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
