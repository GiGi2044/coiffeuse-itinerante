'use client'

import { Fragment, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useIsAdmin } from '@/lib/use-is-admin'
import type { SiteCopy } from '@/types'

const COPY_PATH = 'content/copy/site.json'

interface EditableCopyProps {
  /** Key inside content/copy/site.json */
  copyKey: keyof SiteCopy
  /** Current value, provided by the server render */
  value: string
  as?: 'span' | 'p'
  className?: string
  /** Render \n as <br /> and allow Enter while editing */
  multiline?: boolean
}

// For non-admins (and the first client render) this renders exactly what the
// server rendered — the page stays static and there is no hydration mismatch.
// For a signed-in admin it becomes click-to-edit: the element turns
// contentEditable, and saving merges the key back into content/copy/site.json.
export function EditableCopy({
  copyKey,
  value,
  as: Tag = 'span',
  className,
  multiline = false,
}: EditableCopyProps) {
  const isAdmin = useIsAdmin()
  const router = useRouter()
  const ref = useRef<HTMLElement>(null)
  const cancelledRef = useRef(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const lines = multiline ? value.split('\n') : [value]
  const rendered = lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))

  if (!isAdmin) {
    return <Tag className={className}>{rendered}</Tag>
  }

  function restore() {
    if (ref.current) ref.current.innerText = value
  }

  async function save() {
    const newValue = (ref.current?.innerText ?? '').replace(/\r\n/g, '\n').trim()
    setEditing(false)
    if (!newValue || newValue === value) {
      restore()
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content?path=${encodeURIComponent(COPY_PATH)}`)
      const body = (await res.json().catch(() => null)) as { content?: string } | null
      if (!res.ok || typeof body?.content !== 'string') throw new Error('load failed')

      const copy = JSON.parse(body.content) as Record<string, unknown>
      copy[copyKey] = newValue
      const put = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: COPY_PATH, content: `${JSON.stringify(copy, null, 2)}\n` }),
      })
      if (!put.ok) {
        const putBody = (await put.json().catch(() => null)) as { error?: string } | null
        throw new Error(putBody?.error ?? 'save failed')
      }
      toast.success('Enregistré — en ligne dans quelques secondes')
      router.refresh()
    } catch (e) {
      restore()
      toast.error(
        e instanceof Error && e.message !== 'load failed' ? e.message : "Échec de l'enregistrement — annulé"
      )
    } finally {
      setSaving(false)
    }
  }

  // normal-case while editing: innerText reflects CSS text-transform, so an
  // element styled `uppercase` would otherwise save its uppercased rendering
  return (
    <Tag
      ref={ref as never}
      className={`${className ?? ''} cursor-text outline-offset-4 transition-opacity ${
        editing
          ? 'normal-case outline-1 outline-dashed outline-muted-foreground/70'
          : 'hover:outline-1 hover:outline-dashed hover:outline-muted-foreground/40'
      } ${saving ? 'opacity-60' : ''}`}
      title={editing ? undefined : 'Cliquer pour modifier'}
      contentEditable={editing ? 'plaintext-only' : undefined}
      suppressContentEditableWarning
      onClick={() => {
        if (editing || saving) return
        setEditing(true)
        // Focus after React makes the element editable
        requestAnimationFrame(() => ref.current?.focus())
      }}
      onBlur={() => {
        if (cancelledRef.current) {
          cancelledRef.current = false
          return
        }
        if (editing) void save()
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
          ref.current?.blur() // triggers save via onBlur
        }
      }}
    >
      {rendered}
    </Tag>
  )
}
