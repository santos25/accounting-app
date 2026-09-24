import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "./database.types"
import { getSupabaseEnv } from "./env"

const PUBLIC_PATHS = ["/login", "/auth"]

/** Refresca la sesión de Supabase y redirige a /login si no hay usuario. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, key } = getSupabaseEnv()

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))
      },
    },
  })

  // No poner código entre createServerClient y getClaims: puede cerrar la sesión al azar.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims)
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!isAuthenticated && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && pathname === "/login") {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = "/"
    homeUrl.search = ""
    return NextResponse.redirect(homeUrl)
  }

  return response
}
