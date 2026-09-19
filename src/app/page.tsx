import { SiteContent } from '@/components/SiteContent'
import { getSiteCopy } from '@/lib/content'
import { buildHairSalonJsonLd } from '@/lib/structured-data'

// No EditModeProvider here — the public route is always static, by
// construction, regardless of who's viewing it or whether they're signed in
// as admin. See src/lib/edit-mode.tsx.
export default async function HomePage() {
  const copy = await getSiteCopy()
  return (
    <>
      {/* Built from the same live copy the page renders — stays accurate if
          Patricia edits her hours/prices/phone through the admin editor. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildHairSalonJsonLd(copy)) }}
      />
      <SiteContent copy={copy} />
    </>
  )
}
