import Link from "next/link"
import {
  AlarmClockIcon,
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  WalletIcon,
  CalendarCheckIcon,
} from "lucide-react"
import { DeclarationsTable } from "@/components/declarations-table"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { NewDeclarationButton } from "@/components/new-declaration-button"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listClientSummaries } from "@/lib/data/clients"
import { defaultTaxYear, listDeclarations, listTaxYears } from "@/lib/data/declarations"
import {
  CLOSED_STATUSES,
  DECLARATION_STATUSES,
  DECLARATION_STATUS_LABEL,
  type DeclarationStatus,
} from "@/lib/domain"
import { formatCOP } from "@/lib/format"

const STATUS_BAR_CLASS: Record<DeclarationStatus, string> = {
  PENDIENTE: "bg-status-pendiente",
  DOCUMENTOS_RECIBIDOS: "bg-status-documentos",
  EN_PROCESO: "bg-status-proceso",
  PRESENTADA: "bg-status-presentada",
  NO_OBLIGADO: "bg-status-no-obligado",
}

const UPCOMING_LIMIT = 10

export default async function DashboardPage() {
  const [years, clients] = await Promise.all([listTaxYears(), listClientSummaries()])
  const taxYear = defaultTaxYear(years)
  const rows = await listDeclarations({ taxYear })

  const open = rows.filter((r) => !CLOSED_STATUSES.includes(r.status))
  const overdue = open.filter((r) => r.days_left < 0)
  const thisWeek = open.filter((r) => r.days_left >= 0 && r.days_left <= 7)
  const filed = rows.filter((r) => r.status === "PRESENTADA")
  const billed = rows.reduce((s, r) => s + r.fee, 0)
  const receivable = rows.reduce((s, r) => s + Math.max(r.balance, 0), 0)
  const collected = rows.reduce((s, r) => s + r.amount_paid, 0)
  const upcoming = open.slice(0, UPCOMING_LIMIT)

  const byStatus = DECLARATION_STATUSES.map((status) => ({
    status,
    count: rows.filter((r) => r.status === status).length,
  }))

  return (
    <>
      <PageHeader
        title="Resumen"
        description={`Año gravable ${taxYear} · ${rows.length} declaraciones`}
        actions={<NewDeclarationButton clients={clients} taxYear={taxYear} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Vencidas"
          value={overdue.length}
          hint="Sin presentar y con fecha pasada"
          icon={CircleAlertIcon}
          tone={overdue.length > 0 ? "overdue" : "default"}
        />
        <KpiCard
          title="Vencen en 7 días"
          value={thisWeek.length}
          hint={`${open.length} declaraciones abiertas`}
          icon={AlarmClockIcon}
          tone={thisWeek.length > 0 ? "critical" : "default"}
        />
        <KpiCard
          title="Presentadas"
          value={`${filed.length} / ${rows.length}`}
          hint={
            rows.length
              ? `${Math.round((filed.length / rows.length) * 100)} % del año gravable`
              : "Sin declaraciones"
          }
          icon={CircleCheckIcon}
        />
        <KpiCard
          title="Por cobrar"
          value={formatCOP(receivable)}
          hint={`Facturado ${formatCOP(billed)} · Recaudado ${formatCOP(collected)}`}
          icon={WalletIcon}
        />
      </div>

      {rows.length > 0 ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Estado del año gravable</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {byStatus.map(({ status, count }) =>
                count > 0 ? (
                  <div
                    key={status}
                    className={STATUS_BAR_CLASS[status]}
                    style={{ width: `${(count / rows.length) * 100}%` }}
                    title={`${DECLARATION_STATUS_LABEL[status]}: ${count}`}
                  />
                ) : null
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {byStatus.map(({ status, count }) => (
                <Link
                  key={status}
                  href={`/declaraciones?year=${taxYear}&status=${status}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className={`size-2 rounded-full ${STATUS_BAR_CLASS[status]}`} />
                  {DECLARATION_STATUS_LABEL[status]}
                  <span className="font-medium text-foreground tabular-nums">{count}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Próximos vencimientos</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/declaraciones?year=${taxYear}`}>
              Ver todas
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
        {upcoming.length > 0 ? (
          <DeclarationsTable data={upcoming} />
        ) : (
          <EmptyState
            icon={CalendarCheckIcon}
            title={rows.length ? "Todo al día" : "Aún no hay declaraciones"}
            description={
              rows.length
                ? "No hay declaraciones abiertas para este año gravable."
                : "Crea tus clientes y registra sus declaraciones para ver aquí los vencimientos."
            }
            action={
              clients.length === 0 ? (
                <Button size="sm" asChild>
                  <Link href="/clientes">Ir a clientes</Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </section>
    </>
  )
}
