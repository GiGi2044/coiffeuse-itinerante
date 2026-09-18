'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import { useEditMode, type ListKey } from '@/lib/edit-mode'

// Both render nothing outside the admin editor (editable: false by default,
// see src/lib/edit-mode.tsx) — safe to place directly in SiteContent, which
// is also what the public page renders.

export function AddListItemButton({ list, label }: { list: ListKey; label: string }) {
  const { editable, addListItem } = useEditMode()
  if (!editable) return null
  return (
    <button
      type="button"
      onClick={() => addListItem(list)}
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      <PlusIcon className="size-3.5" aria-hidden />
      {label}
    </button>
  )
}

export function RemoveListItemButton({ list, id }: { list: ListKey; id: string }) {
  const { editable, removeListItem } = useEditMode()
  if (!editable) return null
  return (
    <button
      type="button"
      aria-label="Supprimer"
      title="Supprimer"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        removeListItem(list, id)
      }}
      className="absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
    >
      <XIcon className="size-3.5" aria-hidden />
    </button>
  )
}
