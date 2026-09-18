import type { Metadata } from 'next'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { getSiteCopy } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Éditeur du site',
  robots: { index: false, follow: false },
}

// site.json isn't secret — it's the same content the public page reads — so
// fetching it here doesn't need to wait on the client-side login check.
// AdminPanel gates the actual editor UI behind that check.
export default async function AdminPage() {
  const copy = await getSiteCopy()
  return <AdminPanel initialCopy={copy} />
}
