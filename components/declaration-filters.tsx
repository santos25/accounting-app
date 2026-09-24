"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DECLARATION_STATUSES,
  DECLARATION_STATUS_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  URGENCY_LABEL,
} from "@/lib/domain"
import { cn } from "@/lib/utils"

const ALL = "all"
const URGENCIES = ["overdue", "critical", "soon", "ok"] as const

export function DeclarationFilters({ years, taxYear }: { years: number[]; taxYear: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState(params.get("q") ?? "")

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value && value !== ALL) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  useEffect(() => {
    const current = params.get("q") ?? ""
    if (search === current) return
    const t = setTimeout(() => update("q", search.trim() || null), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const yearOptions = years.includes(taxYear) ? years : [taxYear, ...years]
  const hasFilters = ["status", "urgency", "payment", "q"].some((k) => params.has(k))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nombre o cédula"
          className="h-8 pl-8"
        />
      </div>

      <FilterSelect
        label="Año gravable"
        value={String(taxYear)}
        onChange={(v) => update("year", v)}
        options={yearOptions.map((y) => ({ value: String(y), label: `AG ${y}` }))}
      />
      <FilterSelect
        label="Estado"
        value={params.get("status") ?? ALL}
        onChange={(v) => update("status", v)}
        options={[
          { value: ALL, label: "Todos los estados" },
          ...DECLARATION_STATUSES.map((s) => ({ value: s, label: DECLARATION_STATUS_LABEL[s] })),
        ]}
      />
      <FilterSelect
        label="Urgencia"
        value={params.get("urgency") ?? ALL}
        onChange={(v) => update("urgency", v)}
        options={[
          { value: ALL, label: "Cualquier fecha" },
          ...URGENCIES.map((u) => ({ value: u, label: URGENCY_LABEL[u] })),
        ]}
      />
      <FilterSelect
        label="Pago"
        value={params.get("payment") ?? ALL}
        onChange={(v) => update("payment", v)}
        options={[
          { value: ALL, label: "Cualquier pago" },
          ...PAYMENT_STATUSES.map((p) => ({ value: p, label: PAYMENT_STATUS_LABEL[p] })),
        ]}
      />

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("")
            const next = new URLSearchParams()
            if (params.get("year")) next.set("year", params.get("year")!)
            startTransition(() => router.replace(`${pathname}?${next.toString()}`))
          }}
        >
          <XIcon />
          Limpiar
        </Button>
      ) : null}
      <Loader2Icon
        className={cn("size-4 animate-spin text-muted-foreground", !pending && "invisible")}
        aria-hidden
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const active = value !== ALL
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn("w-auto min-w-36", active && "border-primary/40 bg-primary/5")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
