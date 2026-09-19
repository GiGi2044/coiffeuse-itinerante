'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AssistantPane } from '@/components/admin/AssistantPane'
import { Button } from '@/components/ui/button'
import { SiteContent } from '@/components/SiteContent'
import { EditModeProvider, type ListField, type ListKey } from '@/lib/edit-mode'
import type { CarouselImage, NoteItem, SiteCopy, TarifItem } from '@/types'

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
  const [refreshing, setRefreshing] = useState(false)

  function setText(key: keyof SiteCopy, value: string) {
    setDraftCopy((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function setImage(jpegName: string, base64: string) {
    setPendingImages((prev) => new Map(prev).set(jpegName, base64))
    setDirty(true)
  }

  function setListField(list: ListKey, id: string, field: ListField, value: string) {
    setDraftCopy((prev) => {
      if (list === 'tarifs') {
        return {
          ...prev,
          tarifs: prev.tarifs.map((t) => (t.id === id ? ({ ...t, [field]: value } as TarifItem) : t)),
        }
      }
      if (list === 'horaireExtraNotes') {
        return {
          ...prev,
          horaireExtraNotes: prev.horaireExtraNotes.map((n) =>
            n.id === id ? ({ ...n, [field]: value } as NoteItem) : n
          ),
        }
      }
      return {
        ...prev,
        [list]: prev[list].map((item) => (item.id === id ? ({ ...item, [field]: value } as CarouselImage) : item)),
      }
    })
    setDirty(true)
  }

  function addListItem(list: ListKey) {
    setDraftCopy((prev) => {
      if (list === 'tarifs') {
        const item: TarifItem = { id: crypto.randomUUID(), label: 'Nouveau tarif', price: 'CHF 0.-' }
        return { ...prev, tarifs: [...prev.tarifs, item] }
      }
      if (list === 'horaireExtraNotes') {
        const item: NoteItem = { id: crypto.randomUUID(), text: 'Nouvelle ligne' }
        return { ...prev, horaireExtraNotes: [...prev.horaireExtraNotes, item] }
      }
      const item: CarouselImage = {
        id: crypto.randomUUID(),
        name: `carousel-${crypto.randomUUID().slice(0, 8)}.jpg`,
        alt: '',
      }
      return { ...prev, [list]: [...prev[list], item] }
    })
    setDirty(true)
  }

  function removeListItem(list: ListKey, id: string) {
    setDraftCopy((prev) => {
      if (list === 'tarifs') {
        return { ...prev, tarifs: prev.tarifs.filter((t) => t.id !== id) }
      }
      if (list === 'horaireExtraNotes') {
        return { ...prev, horaireExtraNotes: prev.horaireExtraNotes.filter((n) => n.id !== id) }
      }
      return { ...prev, [list]: prev[list].filter((item) => item.id !== id) }
    })
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

  // Escape hatch for content that changed outside this editor (a manual git
  // push, or another browser tab's Apply landing after this page loaded) —
  // busts the cached content tag, then hard-reloads so this component
  // re-mounts with genuinely fresh initialCopy (a soft router.refresh()
  // wouldn't touch draftCopy, since useState only reads its initializer once).
  async function refreshContent() {
    if (dirty || refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/content/revalidate', { method: 'POST' })
      if (!res.ok) {
        toast.error('Impossible de rafraîchir le contenu')
        return
      }
      window.location.reload()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <EditModeProvider value={{ editable: true, setText, setImage, setListField, addListItem, removeListItem }}>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refreshContent()}
              disabled={dirty || refreshing}
              className="mt-3 w-full"
              title={dirty ? 'Appliquez ou annulez vos modifications avant de rafraîchir' : undefined}
            >
              <RefreshCwIcon data-icon="inline-start" className={refreshing ? 'animate-spin' : undefined} />
              Actualiser le contenu en direct
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <AssistantPane />
          </div>
        </aside>
      </div>
    </EditModeProvider>
  )
}
