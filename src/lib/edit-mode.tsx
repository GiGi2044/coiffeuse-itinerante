'use client'

import { createContext, useContext } from 'react'
import type { SiteCopy } from '@/types'

export type ListKey = 'tarifs' | 'carouselItems' | 'workPhotos'
export type ListField = 'label' | 'price' | 'alt'

interface EditModeContextValue {
  /** Whether the current render tree should show click-to-edit affordances. */
  editable: boolean
  /** Stages a top-level text field change in memory — not saved until Apply is clicked. */
  setText: (key: keyof SiteCopy, value: string) => void
  /** Stages a replacement photo (already downscaled to base64 JPEG) — not saved until Apply. */
  setImage: (jpegName: string, base64: string) => void
  /** Stages a single field change on one item of tarifs/carouselItems/workPhotos. */
  setListField: (list: ListKey, id: string, field: ListField, value: string) => void
  /** Appends a new blank item to a list (a fresh id, empty text, and — for the
      two photo lists — a not-yet-uploaded filename ready for EditableImage to
      stage a photo against). */
  addListItem: (list: ListKey) => void
  /** Removes one item from a list by id. */
  removeListItem: (list: ListKey, id: string) => void
}

const noop = () => {}

// Default (no provider) is always non-editable — this is what guarantees the
// public page can never show edit affordances, regardless of session state:
// it simply never renders an EditModeProvider, so EditableCopy/EditableImage
// always see `editable: false` there by construction, not by a runtime check.
const EditModeContext = createContext<EditModeContextValue>({
  editable: false,
  setText: noop,
  setImage: noop,
  setListField: noop,
  addListItem: noop,
  removeListItem: noop,
})

export const EditModeProvider = EditModeContext.Provider

export function useEditMode(): EditModeContextValue {
  return useContext(EditModeContext)
}
