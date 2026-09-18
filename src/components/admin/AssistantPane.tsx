'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLinkIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

interface Status {
  configured: boolean
  draft: boolean
  hasChanges?: boolean
  files?: { filename: string; status: string }[]
  build?: { state: string; url: string } | null
  buildGate?: boolean
}

// For bigger changes than text/photos — layout, new sections, wording
// rewrites. Lives as a permanent sticky sidebar next to the editable page
// preview (see src/app/admin/AdminEditor.tsx), not a separate tab: chat here
// commits to a draft branch, previewed, then Published independently of the
// "Appliquer les changements" button above it (which only ever touches
// content/copy/site.json and content/images/).
export function AssistantPane() {
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const [status, setStatus] = useState<Status | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [confirmingPublish, setConfirmingPublish] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const refreshStatus = useCallback(async () => {
    const res = await fetch('/api/admin/status')
    if (!res.ok) return null
    const data = (await res.json()) as Status
    setStatus(data)
    return data
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  // Poll fast while a build is pending, slowly otherwise; also refresh when the
  // tab regains focus (browsers throttle timers in background tabs)
  const buildPending =
    status?.draft && status.hasChanges && (!status.build || ['QUEUED', 'BUILDING'].includes(status.build.state))
  useEffect(() => {
    const id = setInterval(() => void refreshStatus(), buildPending ? 10_000 : 30_000)
    const onFocus = () => void refreshStatus()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [buildPending, refreshStatus])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    const nextMessages: ChatTurn[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const body = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null
      if (!res.ok || !body?.reply) {
        toast.error(body?.error ?? 'Une erreur est survenue — réessayez')
        setMessages(messages)
        setInput(text)
        return
      }
      setMessages([...nextMessages, { role: 'assistant', content: body.reply }])
      await refreshStatus()
    } catch {
      toast.error('Erreur réseau — la modification est peut-être en cours, revérifiez bientôt')
      await refreshStatus()
    } finally {
      setSending(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const res = await fetch('/api/admin/publish', { method: 'POST' })
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        toast.error(body?.error ?? 'Échec de la publication')
        return
      }
      toast.success('Publié — le site en ligne se met à jour')
      setConfirmingPublish(false)
      await refreshStatus()
    } finally {
      setPublishing(false)
    }
  }

  async function handleDiscard() {
    setDiscarding(true)
    try {
      const res = await fetch('/api/admin/discard', { method: 'POST' })
      if (!res.ok) {
        toast.error('Impossible de supprimer le brouillon')
        return
      }
      toast.success('Brouillon supprimé')
      setMessages([])
      await refreshStatus()
    } finally {
      setDiscarding(false)
    }
  }

  const canPublish = Boolean(
    status?.draft && status.hasChanges && (!status.buildGate || status.build?.state === 'READY')
  )

  return (
    <div>
      <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Assistant</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Pour les changements plus importants (mise en page, ajout d&apos;une section). Décrivez en
        langage courant — les photos se changent en cliquant dessus sur la page, pas ici.
      </p>

      <div className="mt-4 flex max-h-80 flex-col gap-4 overflow-y-auto border-t border-border pt-4">
        {messages.length === 0 && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Rien n&apos;est mis en ligne avant que vous ne publiiez ci-dessous.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i}>
            <p className="text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
              {m.role === 'user' ? 'Vous' : 'Éditeur'}
            </p>
            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {sending && (
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Modification en cours…
          </p>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex flex-col gap-2">
        <label htmlFor="admin-chat" className="sr-only">
          Décrivez un changement
        </label>
        <Textarea
          id="admin-chat"
          rows={3}
          placeholder="Que souhaitez-vous changer ?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
        />
        <Button type="submit" size="sm" disabled={sending || !input.trim()} className="self-start">
          {sending ? 'En cours…' : 'Envoyer'}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Brouillon</h3>

        {!status?.draft || !status.hasChanges ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Aucune modification en attente.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-1">
              {status.files?.map((f) => (
                <li key={f.filename} className="font-mono text-[11px] text-muted-foreground">
                  {f.status === 'added' ? '+ ' : '· '}
                  {f.filename}
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[11px] tracking-[0.15em] text-muted-foreground uppercase">Aperçu</p>
              {status.build?.state === 'READY' ? (
                <a
                  href={status.build.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs underline underline-offset-4 hover:text-muted-foreground"
                >
                  Voir l&apos;aperçu
                  <ExternalLinkIcon className="size-3" aria-hidden />
                </a>
              ) : status.build?.state === 'ERROR' ? (
                <p className="mt-1.5 text-xs text-destructive">
                  La construction de l&apos;aperçu a échoué.
                </p>
              ) : (
                <p className="mt-1.5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  Construction…
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
              {confirmingPublish ? (
                <>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Publier ces modifications sur le site en ligne ?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handlePublish} disabled={publishing}>
                      {publishing ? (
                        <>
                          <Loader2Icon data-icon="inline-start" className="animate-spin" />
                          Publication…
                        </>
                      ) : (
                        'Oui, publier'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmingPublish(false)}
                      disabled={publishing}
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <Button size="sm" onClick={() => setConfirmingPublish(true)} disabled={!canPublish}>
                  Publier sur le site en ligne
                </Button>
              )}
              {!canPublish && status.buildGate && status.build?.state !== 'ERROR' && (
                <p className="text-[11px] text-muted-foreground">
                  Se débloque quand l&apos;aperçu est prêt.
                </p>
              )}
              <Button size="sm" variant="ghost" onClick={handleDiscard} disabled={discarding || publishing}>
                {discarding ? 'Suppression…' : 'Supprimer le brouillon'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
