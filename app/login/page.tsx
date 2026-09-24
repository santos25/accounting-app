import type { Metadata } from "next"
import { LandmarkIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Ingresar" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-semibold">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LandmarkIcon className="size-4" />
          </span>
          Rentas
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresar</CardTitle>
            <CardDescription>Gestión de declaraciones de renta</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm next={typeof next === "string" ? next : undefined} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
