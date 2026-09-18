'use client'

import { createContext, useContext } from 'react'
import type { SiteCopy } from '@/types'

interface EditModeContextValue {
  /** Whether the current render tree should show click-to-edit affordances. */
  editable: boolean
  /** Stages a text field change in memory — not saved until Apply is clicked. */
  setText: (key: keyof SiteCopy, value: string) => void
  /** Stages a replacement photo (already downscaled to base64 JPEG) — not saved until Apply. */
  setImage: (jpegName: string, base64: string) => void
}

// Default (no provider) is always non-editable — this is what guarantees the
// public page can never show edit affordances, regardless of session state:
// it simply never renders an EditModeProvider, so EditableCopy/EditableImage
// always see `editable: false` there by construction, not by a runtime check.
const EditModeContext = createContext<EditModeContextValue>({
  editable: false,
  setText: () => {},
  setImage: () => {},
})

export const EditModeProvider = EditModeContext.Provider

export function useEditMode(): EditModeContextValue {
  return useContext(EditModeContext)
}
