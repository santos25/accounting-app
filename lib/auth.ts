import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Verifica la sesión (JWT validado con getClaims) y devuelve el cliente de Supabase.
 * Usar al inicio de cada página y Server Action: proxy.ts es solo un filtro optimista.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/login")
  return {
    supabase,
    userId: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  }
})
