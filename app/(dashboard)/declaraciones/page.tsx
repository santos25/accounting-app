import type { Metadata } from "next"
import { FileSearchIcon } from "lucide-react"
import { DeclarationFilters } from "@/components/declaration-filters"
import { DeclarationsTable } from "@/components/declarations-table"
import { EmptyState } from "@/components/empty-state"
import { NewDeclarationButton } from "@/components/new-declaration-button"
import { PageHeader } from "@/components/page-header"
import { listClientSummaries } from "@/lib/data/clients"
import { defaultTaxYear, listDeclarations, listTaxYears } from "@/lib/data/declarations"
import { formatCOP } from "@/lib/format"
import { parseDeclarationFilters } from "@/lib/search-params"

export const metadata: Metadata = { title: "Declaraciones" }

export default async function DeclarationsPage({ searchParams }: PageProps<"/declaraciones">) {
  const [params, years, clients] = await Promise.all([
    searchParams,
    listTaxYears(),
    listClientSummaries(),
  ])
  const filters = parseDeclarationFilters(params, defaultTaxYear(years))
  const rows = await listDeclarations(filters)
  const totalFee = rows.reduce((sum, r) => sum + r.fee, 0)

  return (
    <>
      <PageHeader
        title="Declaraciones"
        description={`Año gravable ${filters.taxYear} · ${rows.length} declaraciones · ${formatCOP(totalFee)} en cobros`}
        actions={<NewDeclarationButton clients={clients} taxYear={filters.taxYear} />}
      />
      <DeclarationFilters years={years} taxYear={filters.taxYear} />
      {rows.length > 0 ? (
        <DeclarationsTable key={JSON.stringify(filters)} data={rows} />
      ) : (
        <EmptyState
          icon={FileSearchIcon}
          title="No hay declaraciones con estos filtros"
          description={
            clients.length === 0
              ? "Primero crea tus clientes en la sección Clientes."
              : "Crea una declaración o ajusta los filtros."
          }
        />
      )}
    </>
  )
}
