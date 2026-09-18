'use client'

import { useEffect, useState } from 'react'

// Positive results are cached (module + sessionStorage, short TTL) so navigation
// doesn't re-check; negatives are never cached, so signing in takes effect on the
// next page view without a hard reload.
const TTL_MS = 60_000
let isAdminCached = false
let inflight: Promise<boolean> | null = null

function checkAdmin(): Promise<boolean> {
  if (isAdminCached) return Promise.resolve(true)
  try {
    const at = Number(sessionStorage.getItem('admin_me_at') ?? 0)
    if (at && Date.now() - at < TTL_MS) {
      isAdminCached = true
      return Promise.resolve(true)
    }
  } catch {
    // sessionStorage unavailable — fall through to the network check
  }
  inflight ??= fetch('/api/admin/me', { cache: 'no-store' })
    .then((res) => {
      const ok = res.status === 204
      if (ok) {
        isAdminCached = true
        try {
          sessionStorage.setItem('admin_me_at', String(Date.now()))
        } catch {
          // best-effort cache only
        }
      }
      return ok
    })
    .catch(() => false)
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Whether the visitor has an admin session. Always false on the server and first client render. */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    void checkAdmin().then((ok) => {
      if (!cancelled && ok) setIsAdmin(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return isAdmin
}
