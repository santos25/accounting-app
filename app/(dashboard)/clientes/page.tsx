import type { Metadata } from "next"
import Link from "next/link"
import { KeyRoundIcon, UsersIcon } from "lucide-react"
import { NewClientButton } from "@/components/client-actions"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listClients } from "@/lib/data/clients"
import { formatDate } from "@/lib/format"

export const metadata: Metadata = { title: "Clientes" }

export default async function ClientsPage() {
  const clients = await listClients()

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`${clients.length} clientes registrados`}
        actions={<NewClientButton />}
      />
      {clients.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Aún no tienes clientes"
          description="Crea tu primer cliente o importa tu Excel con npm run import:excel."
          action={<NewClientButton />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-xs">Cliente</TableHead>
                <TableHead className="h-9 text-xs">Contacto</TableHead>
                <TableHead className="h-9 text-xs">Credenciales</TableHead>
                <TableHead className="h-9 text-xs">Última declaración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => {
                const latest = [...c.declarations].sort((a, b) => b.tax_year - a.tax_year)[0]
                return (
                  <TableRow key={c.id}>
                    <TableCell className="py-2">
                      <Link href={`/clientes/${c.id}`} className="flex flex-col hover:underline">
                        <span className="font-medium">
                          {c.full_name}
                          {!c.active ? (
                            <Badge variant="secondary" className="ml-2">
                              Inactivo
                            </Badge>
                          ) : null}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.document_type} {c.document_number}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{c.email ?? "—"}</span>
                        <span>{c.phone ?? ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-1.5 text-xs">
                        <CredentialPill ok={c.has_portal_password} label="Contraseña" />
                        <CredentialPill ok={c.has_e_signature} label="Firma" />
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {latest ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={latest.status} />
                          <span className="text-xs text-muted-foreground tabular-nums">
                            AG {latest.tax_year} · {formatDate(latest.due_date)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin declaraciones</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

function CredentialPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1 text-status-presentada"
          : "inline-flex items-center gap-1 text-muted-foreground line-through"
      }
      title={ok ? `${label} registrada` : `${label} sin registrar`}
    >
      <KeyRoundIcon className="size-3" aria-hidden />
      {label}
    </span>
  )
}
