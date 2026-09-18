import { SiteContent } from '@/components/SiteContent'
import { getSiteCopy } from '@/lib/content'

// No EditModeProvider here — the public route is always static, by
// construction, regardless of who's viewing it or whether they're signed in
// as admin. See src/lib/edit-mode.tsx.
export default async function HomePage() {
  const copy = await getSiteCopy()
  return <SiteContent copy={copy} />
}
