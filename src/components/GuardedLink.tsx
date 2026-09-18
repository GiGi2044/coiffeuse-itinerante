'use client'

import type { ReactNode } from 'react'
import { useEditMode } from '@/lib/edit-mode'

// A normal <a> everywhere except inside the admin editor, where clicking it
// must edit the label (via a nested EditableCopy) rather than actually
// navigate/scroll/dial — the click still bubbles up to this element after
// the inner EditableCopy's own handler runs, so preventDefault() here just
// stops the browser's default action without stopping that from happening.
export function GuardedLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  const { editable } = useEditMode()
  return (
    <a href={href} className={className} onClick={editable ? (e) => e.preventDefault() : undefined}>
      {children}
    </a>
  )
}
