"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { DeclarationForm } from "@/components/forms/declaration-form"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { ClientSummary } from "@/lib/data/clients"

export function NewDeclarationButton({
  clients,
  clientId,
  taxYear,
  variant = "default",
}: {
  clients?: ClientSummary[]
  clientId?: string
  taxYear: number
  variant?: "default" | "outline"
}) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={variant} size="sm">
          <PlusIcon />
          Nueva declaración
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Nueva declaración</SheetTitle>
          <SheetDescription>
            Si dejas el vencimiento vacío se calcula con los dos últimos dígitos del documento.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {open ? (
            <DeclarationForm
              clients={clients}
              clientId={clientId}
              taxYear={taxYear}
              onSuccess={() => setOpen(false)}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
