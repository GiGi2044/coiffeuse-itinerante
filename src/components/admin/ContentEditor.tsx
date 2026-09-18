'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const COPY_PATH = 'content/copy/site.json'

// Raw-JSON fallback editor for the whole site.json file — most edits happen
// via click-to-edit directly on the page, this is here for anything that
// isn't wired up as an EditableCopy field yet.
export function ContentEditor() {
  const [content, setContent] = useState<string | null>(null)
  const [savedContent, setSavedContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const dirty = content !== null && content !== savedContent

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/content?path=${encodeURIComponent(COPY_PATH)}`)
      const body = (await res.json().catch(() => null)) as { content?: string; error?: string } | null
      if (!res.ok || typeof body?.content !== 'string') {
        toast.error(body?.error ?? 'Impossible de charger le contenu')
        return
      }
      setContent(body.content)
      setSavedContent(body.content)
    } catch {
      toast.error('Erreur réseau — vérifiez votre connexion')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (content === null || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: COPY_PATH, content }),
      })
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        const message = body?.error ?? "Échec de l'enregistrement — réessayez"
        setSaveError(message)
        toast.error(message)
        return
      }
      setSavedContent(content)
      toast.success('Enregistré — en ligne dans quelques secondes')
    } catch {
      toast.error('Erreur réseau — votre texte est toujours là, réessayez')
    } finally {
      setSaving(false)
    }
  }

  async function handleRefreshContent() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/content/revalidate', { method: 'POST' })
      if (!res.ok) {
        toast.error('Impossible de rafraîchir le contenu en ligne')
        return
      }
      toast.success('Contenu en ligne rafraîchi')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="border-t pt-8">
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        La plupart des modifications se font directement sur la page (cliquez sur un texte pour
        le modifier). Ceci est le fichier de contenu complet, pour tout ce qui n&apos;est pas
        encore éditable directement sur la page.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        {content === null ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <>
            <label htmlFor="content-editor" className="sr-only">
              Contenu du fichier
            </label>
            <Textarea
              id="content-editor"
              rows={22}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm leading-relaxed"
            />
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void handleSave()} disabled={!dirty || saving}>
                {saving ? (
                  <>
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
              {dirty && !saving && (
                <p className="text-xs text-muted-foreground">Modifications non enregistrées</p>
              )}
              <Button variant="ghost" size="sm" onClick={handleRefreshContent} disabled={refreshing}>
                <RefreshCwIcon data-icon="inline-start" className={refreshing ? 'animate-spin' : undefined} />
                Rafraîchir le contenu en ligne
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
