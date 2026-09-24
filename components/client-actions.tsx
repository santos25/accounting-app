"use client"

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { deleteClientAction } from "@/app/(dashboard)/clientes/actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ClientForm } from "@/components/forms/client-form"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { ClientDetail } from "@/lib/data/clients"

function ClientSheet({
  client,
  trigger,
}: {
  client?: ClientDetail
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{client ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>
            {client ? client.full_name : "Registra los datos y credenciales del cliente."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {open ? <ClientForm client={client} onSuccess={() => setOpen(false)} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function NewClientButton() {
  return (
    <ClientSheet
      trigger={
        <Button size="sm">
          <PlusIcon />
          Nuevo cliente
        </Button>
      }
    />
  )
}

export function EditClientButton({ client }: { client: ClientDetail }) {
  return (
    <ClientSheet
      client={client}
      trigger={
        <Button size="sm" variant="outline">
          <PencilIcon />
          Editar
        </Button>
      }
    />
  )
}

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="icon-sm" variant="ghost" aria-label="Eliminar cliente" onClick={() => setOpen(true)}>
        <Trash2Icon />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Eliminar cliente"
        description={`Se eliminará a ${name} junto con todas sus declaraciones. Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          try {
            await deleteClientAction(id)
          } catch {
            toast.error("No se pudo eliminar el cliente")
          }
        }}
      />
    </>
  )
}
