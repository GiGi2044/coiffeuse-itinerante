'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLinkIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ContentEditor } from '@/components/admin/ContentEditor'

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

type Auth = 'unknown' | 'signed-out' | 'signed-in'
type Tab = 'content' | 'assistant'

export function AdminPanel() {
  const [auth, setAuth] = useState<Auth>('unknown')
  const [tab, setTab] = useState<Tab>('content')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

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
    if (res.status === 401) {
      setAuth('signed-out')
      return null
    }
    if (!res.ok) return null
    const data = (await res.json()) as Status
    setAuth('signed-in')
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
    if (auth !== 'signed-in') return
    const id = setInterval(() => void refreshStatus(), buildPending ? 10_000 : 30_000)
    const onFocus = () => void refreshStatus()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [auth, buildPending, refreshStatus])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoggingIn(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(body?.error ?? 'Connexion impossible')
        return
      }
      setPassword('')
      await refreshStatus()
    } catch {
      toast.error('Erreur réseau — vérifiez votre connexion')
    } finally {
      setLoggingIn(false)
    }
  }

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

  if (auth === 'unknown') {
    return <p className="text-sm text-muted-foreground">Chargement…</p>
  }

  if (auth === 'signed-out') {
    return (
      <form onSubmit={handleLogin} className="max-w-sm">
        <label htmlFor="admin-password" className="text-sm font-medium">
          Mot de passe
        </label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2"
        />
        <Button type="submit" size="lg" disabled={loggingIn || !password} className="mt-4">
          {loggingIn ? (
            <>
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
              Connexion…
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>
    )
  }

  const canPublish = Boolean(
    status?.draft &&
      status.hasChanges &&
      (!status.buildGate || status.build?.state === 'READY')
  )

  const assistantView = (
    <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
      {/* Chat */}
      <section>
        <div className="flex min-h-[320px] flex-col gap-6 border-t pt-8">
          {messages.length === 0 && (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Décrivez un changement en langage courant — « change la couleur du bouton »,
              « ajoute une ligne de tarif », « reformule le texte d&apos;accueil ». Rien n&apos;est
              mis en ligne avant que vous ne publiiez. Les photos se changent dans l&apos;onglet
              Contenu, pas ici.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'ml-auto max-w-[85%]' : 'max-w-[85%]'}>
              <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                {m.role === 'user' ? 'Vous' : 'Éditeur'}
              </p>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {sending && (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Modification en cours — cela peut prendre une minute…
            </p>
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className="mt-6 flex flex-col gap-3">
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
          <Button type="submit" disabled={sending || !input.trim()} className="self-start">
            {sending ? 'En cours…' : 'Envoyer'}
          </Button>
        </form>
      </section>

      {/* Status rail */}
      <aside className="border-t pt-8 lg:pl-8">
        <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Brouillon</h2>

        {!status?.draft || !status.hasChanges ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Aucune modification en attente. Le site en ligne correspond à la version publiée.
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-1">
              {status.files?.map((f) => (
                <li key={f.filename} className="font-mono text-xs text-muted-foreground">
                  {f.status === 'added' ? '+ ' : '· '}
                  {f.filename}
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t pt-4">
              <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">Aperçu</p>
              {status.build?.state === 'READY' ? (
                <a
                  href={status.build.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:text-muted-foreground"
                >
                  Voir l&apos;aperçu
                  <ExternalLinkIcon className="size-3.5" aria-hidden />
                </a>
              ) : status.build?.state === 'ERROR' ? (
                <p className="mt-2 text-sm text-destructive">
                  La construction de l&apos;aperçu a échoué — cette modification casserait le
                  site. Demandez une correction à l&apos;éditeur, ou supprimez le brouillon.
                </p>
              ) : (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Construction de l&apos;aperçu…
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t pt-4">
              {confirmingPublish ? (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Publier ces modifications sur le site en ligne ?
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handlePublish} disabled={publishing}>
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
                      variant="outline"
                      onClick={() => setConfirmingPublish(false)}
                      disabled={publishing}
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <Button onClick={() => setConfirmingPublish(true)} disabled={!canPublish}>
                  Publier sur le site en ligne
                </Button>
              )}
              {!canPublish && status.buildGate && status.build?.state !== 'ERROR' && (
                <p className="text-xs text-muted-foreground">
                  La publication se débloque quand l&apos;aperçu est prêt.
                </p>
              )}
              <Button variant="ghost" onClick={handleDiscard} disabled={discarding || publishing}>
                {discarding ? 'Suppression…' : 'Supprimer le brouillon'}
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  )

  return (
    <div>
      <div role="tablist" className="flex gap-8 border-b">
        {(
          [
            ['content', 'Contenu'],
            ['assistant', 'Assistant'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b pb-3 text-xs tracking-[0.2em] uppercase transition-colors ${
              tab === value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">{tab === 'content' ? <ContentEditor /> : assistantView}</div>
    </div>
  )
}
