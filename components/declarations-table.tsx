"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import {
  deleteDeclarationAction,
  updateDeclarationStatusAction,
} from "@/app/(dashboard)/declaraciones/actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DeclarationForm } from "@/components/forms/declaration-form"
import { MoneyCell } from "@/components/money"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { URGENCY_BORDER_CLASS, UrgencyIndicator } from "@/components/urgency-indicator"
import type { DeclarationRow } from "@/lib/data/declarations"
import {
  DECLARATION_STATUSES,
  DECLARATION_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  getUrgency,
  type DeclarationStatus,
} from "@/lib/domain"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

const helper = createColumnHelper<typeof features, DeclarationRow>()

type RowActions = {
  onEdit: (row: DeclarationRow) => void
  onDelete: (row: DeclarationRow) => void
  onStatus: (row: DeclarationRow, status: DeclarationStatus) => void
}

function buildColumns({ onEdit, onDelete, onStatus }: RowActions, showYear: boolean) {
  return helper.columns([
    helper.accessor("full_name", {
      header: "Cliente",
      sortFn: "text",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/clientes/${row.original.client_id}`}
            className="truncate font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.full_name}
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.document_number}
            {showYear ? ` · AG ${row.original.tax_year}` : ""}
          </span>
        </div>
      ),
    }),
    helper.accessor("due_date", {
      header: "Vencimiento",
      sortFn: "alphanumeric",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="tabular-nums">{formatDate(row.original.due_date)}</span>
          <UrgencyIndicator daysLeft={row.original.days_left} status={row.original.status} />
        </div>
      ),
    }),
    helper.accessor("status", {
      header: "Estado",
      sortFn: "alphanumeric",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    }),
    helper.accessor("fee", {
      header: () => <span className="block text-right">Cobro</span>,
      cell: ({ row }) => (
        <MoneyCell fee={row.original.fee} amountPaid={row.original.amount_paid} />
      ),
    }),
    helper.accessor("payment_status", {
      header: "Pago",
      sortFn: "alphanumeric",
      cell: ({ row }) => (
        <span
          className={cn(
            "text-xs",
            row.original.payment_status === "PAGADO"
              ? "text-status-presentada"
              : "text-muted-foreground"
          )}
        >
          {PAYMENT_STATUS_LABEL[row.original.payment_status]}
        </span>
      ),
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="truncate">{row.original.full_name}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                <PencilIcon />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Cambiar estado</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={row.original.status}
                    onValueChange={(v) => onStatus(row.original, v as DeclarationStatus)}
                  >
                    {DECLARATION_STATUSES.map((s) => (
                      <DropdownMenuRadioItem key={s} value={s}>
                        {DECLARATION_STATUS_LABEL[s]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row.original)}>
                <Trash2Icon />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ])
}

export function DeclarationsTable({
  data,
  showYear = false,
}: {
  data: DeclarationRow[]
  showYear?: boolean
}) {
  const [editing, setEditing] = useState<DeclarationRow | null>(null)
  const [deleting, setDeleting] = useState<DeclarationRow | null>(null)
  const [, startTransition] = useTransition()

  const [columns] = useState(() =>
    buildColumns(
      {
        onEdit: setEditing,
        onDelete: setDeleting,
        onStatus: (row, status) =>
          startTransition(async () => {
            try {
              await updateDeclarationStatusAction(row.id, status)
              toast.success(`${row.full_name}: ${DECLARATION_STATUS_LABEL[status]}`)
            } catch {
              toast.error("No se pudo cambiar el estado")
            }
          }),
      },
      showYear
    )
  )

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.id,
    enableSortingRemoval: false,
  })

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <TableHead
                      key={header.id}
                      className={cn("h-9 text-xs", header.column.id === "fee" && "text-right")}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 hover:text-foreground",
                            header.column.id === "fee" && "w-full justify-end"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon className="size-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon className="size-3" />
                          ) : (
                            <ArrowUpDownIcon className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const urgency = getUrgency(row.original.days_left, row.original.status)
              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setEditing(row.original)}
                >
                  {row.getAllCells().map((cell, i) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-2",
                        i === 0 && "border-l-3",
                        i === 0 && URGENCY_BORDER_CLASS[urgency]
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing?.full_name}</SheetTitle>
            <SheetDescription>
              Declaración año gravable {editing?.tax_year} · {editing?.document_type}{" "}
              {editing?.document_number}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {editing ? (
              <DeclarationForm
                key={editing.id}
                declaration={editing}
                taxYear={editing.tax_year}
                onSuccess={() => setEditing(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar declaración"
        description={`Se eliminará la declaración ${deleting?.tax_year} de ${deleting?.full_name}. Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await deleteDeclarationAction(deleting.id)
            toast.success("Declaración eliminada")
          } catch {
            toast.error("No se pudo eliminar")
          }
        }}
      />
    </>
  )
}
