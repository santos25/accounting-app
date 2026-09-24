"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import type { ActionState } from "@/lib/validation"

/** Muestra un toast cuando cambia el resultado de una Server Action. */
export function useActionFeedback(state: ActionState, onSuccess?: () => void) {
  const last = useRef(state)
  useEffect(() => {
    if (state === last.current) return
    last.current = state
    if (state.ok) {
      if (state.message) toast.success(state.message)
      onSuccess?.()
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, onSuccess])
}

export function fieldError(state: ActionState, name: string) {
  return state.fieldErrors?.[name]?.[0]
}
