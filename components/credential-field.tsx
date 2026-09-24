"use client"

import { useEffect, useState, useTransition } from "react"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const AUTO_HIDE_MS = 30_000
const MASK = "••••••••••"

export function CredentialField({
  label,
  hasValue,
  reveal,
}: {
  label: string
  hasValue: boolean
  reveal: () => Promise<string | null>
}) {
  const [value, setValue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (value === null) return
    const timer = setTimeout(() => setValue(null), AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [value])

  async function load() {
    const plain = await reveal()
    if (plain === null) toast.error("No se pudo descifrar la credencial")
    return plain
  }

  function toggle() {
    if (value !== null) return setValue(null)
    startTransition(async () => setValue(await load()))
  }

  function copy() {
    startTransition(async () => {
      const plain = value ?? (await load())
      if (plain === null) return
      await navigator.clipboard.writeText(plain)
      setCopied(true)
      toast.success(`${label} copiada`)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-9 items-center gap-1 rounded-md border bg-muted/40 pr-1 pl-3">
        <span className="flex-1 truncate font-mono text-sm">
          {!hasValue ? (
            <span className="text-muted-foreground">Sin registrar</span>
          ) : (
            value ?? MASK
          )}
        </span>
        {hasValue ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={toggle}
                  disabled={pending}
                  aria-label={value !== null ? "Ocultar" : "Mostrar"}
                >
                  {value !== null ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{value !== null ? "Ocultar" : "Mostrar (30 s)"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={copy}
                  disabled={pending}
                  aria-label="Copiar"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar</TooltipContent>
            </Tooltip>
          </>
        ) : null}
      </div>
    </div>
  )
}
