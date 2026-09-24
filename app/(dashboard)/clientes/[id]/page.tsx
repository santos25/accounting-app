import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeftIcon, FileTextIcon, MailIcon, PhoneIcon } from "lucide-react"
import { DeleteClientButton, EditClientButton } from "@/components/client-actions"
import { CredentialField } from "@/components/credential-field"
import { DeclarationsTable } from "@/components/declarations-table"
import { EmptyState } from "@/components/empty-state"
import { NewDeclarationButton } from "@/components/new-declaration-button"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getClient } from "@/lib/data/clients"
import { defaultTaxYear, listDeclarationsForClient } from "@/lib/data/declarations"
import { lastTwoDigits } from "@/lib/domain"
import { revealCredentialAction } from "../actions"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({ params }: PageProps<"/clientes/[id]">): Promise<Metadata> {
  const { id } = await params
  const client = UUID_RE.test(id) ? await getClient(id) : null
  return { title: client?.full_name ?? "Cliente" }
}

export default async function ClientPage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const [client, declarations] = await Promise.all([getClient(id), listDeclarationsForClient(id)])
  if (!client) notFound()

  const taxYear = defaultTaxYear([])

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground" asChild>
        <Link href="/clientes">
          <ChevronLeftIcon />
          Clientes
        </Link>
      </Button>

      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {client.full_name}
            {!client.active ? <Badge variant="secondary">Inactivo</Badge> : null}
          </span>
        }
        description={
          <span className="font-mono">
            {client.document_type} {client.document_number} · dígitos DIAN{" "}
            {lastTwoDigits(client.document_number)}
          </span>
        }
        actions={
          <>
            <EditClientButton client={client} />
            <DeleteClientButton id={client.id} name={client.full_name} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Credenciales DIAN</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CredentialField
              label="Contraseña"
              hasValue={client.has_portal_password}
              reveal={revealCredentialAction.bind(null, client.id, "portal_password")}
            />
            <CredentialField
              label="Firma electrónica"
              hasValue={client.has_e_signature}
              reveal={revealCredentialAction.bind(null, client.id, "e_signature")}
            />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <span className="flex items-center gap-2">
              <MailIcon className="size-4 text-muted-foreground" />
              {client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : "—"}
            </span>
            <span className="flex items-center gap-2">
              <PhoneIcon className="size-4 text-muted-foreground" />
              {client.phone ?? "—"}
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="declaraciones">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="declaraciones">Declaraciones</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
          </TabsList>
          <NewDeclarationButton clientId={client.id} taxYear={taxYear} variant="outline" />
        </div>
        <TabsContent value="declaraciones" className="mt-3">
          {declarations.length ? (
            <DeclarationsTable data={declarations} showYear />
          ) : (
            <EmptyState
              icon={FileTextIcon}
              title="Sin declaraciones"
              description="Registra la declaración del año gravable para empezar a controlar su vencimiento."
            />
          )}
        </TabsContent>
        <TabsContent value="notas" className="mt-3">
          <Card size="sm">
            <CardContent className="text-sm whitespace-pre-wrap">
              {client.notes || <span className="text-muted-foreground">Sin notas.</span>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
