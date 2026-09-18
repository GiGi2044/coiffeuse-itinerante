'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { AdminEditor } from '@/components/admin/AdminEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SiteCopy } from '@/types'

type Auth = 'unknown' | 'signed-out' | 'signed-in'

// Login gate for /admin. Once signed in, renders the actual editor
// (AdminEditor) — the page itself, editable, plus the sticky Assistant
// sidebar. `initialCopy` is fetched server-side in src/app/admin/page.tsx
// (site.json isn't secret — it's the same content the public page reads).
export function AdminPanel({ initialCopy }: { initialCopy: SiteCopy }) {
  const [auth, setAuth] = useState<Auth>('unknown')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/admin/status')
    setAuth(res.status === 401 ? 'signed-out' : 'signed-in')
  }, [])

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

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
      await checkAuth()
    } catch {
      toast.error('Erreur réseau — vérifiez votre connexion')
    } finally {
      setLoggingIn(false)
    }
  }

  if (auth === 'unknown') {
    return <p className="p-6 text-sm text-muted-foreground">Chargement…</p>
  }

  if (auth === 'signed-out') {
    return (
      <div className="mx-auto w-full max-w-sm px-6 py-20">
        <h1 className="text-xl font-semibold tracking-tight">Éditeur du site</h1>
        <form onSubmit={handleLogin} className="mt-6">
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
      </div>
    )
  }

  return <AdminEditor initialCopy={initialCopy} />
}
