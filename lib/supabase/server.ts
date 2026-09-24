import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "./database.types"
import { getSupabaseEnv } from "./env"

/** Cliente por request; actúa con la sesión del usuario, así que aplica RLS. */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = getSupabaseEnv()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Llamado desde un Server Component: proxy.ts ya refresca la sesión.
        }
      },
    },
  })
}
