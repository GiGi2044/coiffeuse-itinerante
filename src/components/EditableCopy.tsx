'use client'

import { Fragment, useRef, useState } from 'react'
import { useEditMode, type ListField, type ListKey } from '@/lib/edit-mode'
import type { SiteCopy } from '@/types'

interface BaseProps {
  /** Current value, provided by the parent (server render on the public page,
      or the admin editor's in-memory draft on /admin) */
  value: string
  as?: 'span' | 'p'
  className?: string
  /** Render \n as <br /> and allow Enter while editing */
  multiline?: boolean
}

// Either a top-level content/copy/site.json key, or one field on one item of
// a list (tarifs/carouselItems/workPhotos) — the two ways a piece of text on
// the page maps back to the content file.
type EditableCopyProps =
  | (BaseProps & { copyKey: keyof SiteCopy; listTarget?: undefined })
  | (BaseProps & { copyKey?: undefined; listTarget: { list: ListKey; id: string; field: ListField } })

// Editability comes from context (see src/lib/edit-mode.tsx), not a
// self-check — outside an EditModeProvider (the public page) this always
// renders exactly what the server rendered, so the page stays static with no
// hydration mismatch risk. Inside the admin editor's EditModeProvider it
// becomes click-to-edit: the element turns contentEditable, and on
// blur/Enter it stages the new value in the editor's in-memory draft — it is
// NOT saved to the server here, that only happens when the editor's "Apply"
// button is used (see src/components/admin/AdminEditor.tsx).
export function EditableCopy({
  value,
  as: Tag = 'span',
  className,
  multiline = false,
  copyKey,
  listTarget,
}: EditableCopyProps) {
  const { editable, setText, setListField } = useEditMode()
  const ref = useRef<HTMLElement>(null)
  const cancelledRef = useRef(false)
  const [editing, setEditing] = useState(false)

  const lines = multiline ? value.split('\n') : [value]
  const rendered = lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))

  if (!editable) {
    return <Tag className={className}>{rendered}</Tag>
  }

  function restore() {
    if (ref.current) ref.current.innerText = value
  }

  function commit() {
    const newValue = (ref.current?.innerText ?? '').replace(/\r\n/g, '\n').trim()
    setEditing(false)
    // An empty result is a deliberate clear (delete all the text, click
    // away) — save it. Only a genuine no-op (unchanged text) is skipped.
    // To back out of an edit instead, Escape restores the original value.
    if (newValue === value) {
      restore()
      return
    }
    if (copyKey) setText(copyKey, newValue)
    else setListField(listTarget.list, listTarget.id, listTarget.field, newValue)
  }

  // normal-case while editing: innerText reflects CSS text-transform, so an
  // element styled `uppercase` would otherwise save its uppercased rendering
  //
  // key={editing}: contentEditable lets the browser mutate this node's DOM
  // directly (typing, deleting) without React knowing — deleting everything
  // is the extreme case, leaving a DOM React never rendered. Without a key
  // change, leaving edit mode makes React try to reconcile its remembered
  // tree against that browser-mutated node and crash (e.g. a removeChild on
  // a node that's no longer there). Keying by `editing` forces a clean
  // unmount/remount exactly on that transition, never mid-edit (the key is
  // stable while typing, so focus isn't disrupted).
  return (
    <Tag
      key={String(editing)}
      ref={ref as never}
      className={`${className ?? ''} cursor-text outline-offset-4 transition-opacity ${
        editing
          ? 'normal-case outline-1 outline-dashed outline-muted-foreground/70'
          : 'hover:outline-1 hover:outline-dashed hover:outline-muted-foreground/40'
      }`}
      title={editing ? undefined : 'Cliquer pour modifier'}
      contentEditable={editing ? 'plaintext-only' : undefined}
      suppressContentEditableWarning
      onClick={() => {
        if (editing) return
        setEditing(true)
        // Focus after React makes the element editable
        requestAnimationFrame(() => ref.current?.focus())
      }}
      onBlur={() => {
        if (cancelledRef.current) {
          cancelledRef.current = false
          return
        }
        if (editing) commit()
      }}
      onKeyDown={(e) => {
        if (!editing) return
        if (e.key === 'Escape') {
          e.preventDefault()
          cancelledRef.current = true
          setEditing(false)
          restore()
          ref.current?.blur()
        } else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          ref.current?.blur() // triggers commit via onBlur
        }
      }}
    >
      {rendered}
    </Tag>
  )
}
