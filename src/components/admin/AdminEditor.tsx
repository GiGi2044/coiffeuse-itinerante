'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { AssistantPane } from '@/components/admin/AssistantPane'
import { Button } from '@/components/ui/button'
import { SiteContent } from '@/components/SiteContent'
import { EditModeProvider } from '@/lib/edit-mode'
import type { SiteCopy } from '@/types'

const COPY_PATH = 'content/copy/site.json'

// The actual editable page (SiteContent, wrapped in an EditModeProvider) plus
// a sticky sidebar: an explicit "Appliquer" button for the staged text/photo
// edits, and the Assistant pane for bigger changes. Edits made in place
// (click a text or a photo) only update local state here — nothing reaches
// the server until Appliquer les changements is clicked.
export function AdminEditor({ initialCopy }: { initialCopy: SiteCopy }) {
  const router = useRouter()
  const [draftCopy, setDraftCopy] = useState<SiteCopy>(initialCopy)
  const [pendingImages, setPendingImages] = useState<Map<string, string>>(new Map())
  const [dirty, setDirty] = useState(false)
  const [applying, setApplying] = useState(false)

  function setText(key: keyof SiteCopy, value: string) {
    setDraftCopy((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function setImage(jpegName: string, base64: string) {
    setPendingImages((prev) => new Map(prev).set(jpegName, base64))
    setDirty(true)
  }

  async function applyChanges() {
    if (!dirty || applying) return
    setApplying(true)
    try {
      const putCopy = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: COPY_PATH, content: `${JSON.stringify(draftCopy, null, 2)}\n` }),
      })
      if (!putCopy.ok) {
        const body = (await putCopy.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? "Échec de l'enregistrement du texte")
      }

      for (const [jpegName, base64] of pendingImages) {
        const putImage = await fetch('/api/admin/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: `content/images/${jpegName}`, content: base64, encoding: 'base64' }),
        })
        if (!putImage.ok) {
          const body = (await putImage.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? `Échec de l'envoi de la photo ${jpegName}`)
        }
      }

      setPendingImages(new Map())
      setDirty(false)
      toast.success('Modifications appliquées — en ligne dans quelques secondes')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'application des changements")
    } finally {
      setApplying(false)
    }
  }

  return (
    <EditModeProvider value={{ editable: true, setText, setImage }}>
      <div className="grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
        {/* The real page, editable in place */}
        <div className="min-w-0">
          <SiteContent copy={draftCopy} />
        </div>

        {/* Sticky sidebar — follows scroll on desktop, stacks below on mobile */}
        <aside className="border-t border-border bg-background px-4 py-8 sm:px-6 lg:sticky lg:top-6 lg:self-start lg:border-t-0 lg:px-0 lg:py-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <Button onClick={() => void applyChanges()} disabled={!dirty || applying} className="w-full">
              {applying ? (
                <>
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                  Application…
                </>
              ) : (
                'Appliquer les changements'
              )}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              {dirty
                ? 'Modifications non appliquées'
                : 'Cliquez un texte ou une photo sur la page pour la modifier.'}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <AssistantPane />
          </div>
        </aside>
      </div>
    </EditModeProvider>
  )
}
