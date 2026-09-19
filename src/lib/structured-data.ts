import { JOURS, JOURS_SCHEMA_ORG, SERVICE_AREA_TOWNS, SITE_URL } from '@/lib/site-data'
import type { SiteCopy } from '@/types'

// Builds schema.org HairSalon structured data straight from the same live
// content the page renders — if Patricia edits her hours, prices, phone, or
// address through the admin editor, this stays accurate automatically
// instead of drifting out of sync with a hand-written copy.

function toInternationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('0') ? `+41${digits.slice(1)}` : `+${digits}`
}

// "1720 Corminboeuf" → { postalCode: "1720", addressLocality: "Corminboeuf" }.
// Falls back to putting the whole string in addressLocality if the format
// ever changes to something this simple pattern doesn't expect.
function parseAddress(address: string): { postalCode?: string; addressLocality: string } {
  const match = /^(\d{4})\s+(.+)$/.exec(address.trim())
  if (!match) return { addressLocality: address.trim() }
  return { postalCode: match[1], addressLocality: match[2] }
}

// Extracts every "CHF <number>" amount mentioned across the tarifs, returns
// the min/max as a schema.org priceRange string. Returns undefined (omit the
// field) rather than guess, if no amounts are found — e.g. if she ever
// rewrites every tarif line without the "CHF" prefix.
function priceRangeFrom(copy: SiteCopy): string | undefined {
  const text = [...copy.tarifs.map((t) => t.price), copy.tarifAnnulation].join(' ')
  const amounts = [...text.matchAll(/CHF\s*(\d+)/g)].map((m) => Number(m[1]))
  if (amounts.length === 0) return undefined
  return `CHF ${Math.min(...amounts)}-${Math.max(...amounts)}`
}

// Parses "9h – 12h00" into ["09:00", "12:00"]. Returns undefined if the text
// doesn't contain exactly the two times expected — never emits a guessed
// time, since these are shown to Google as fact.
function parseTimeRange(text: string): [string, string] | undefined {
  const matches = [...text.matchAll(/(\d{1,2})h(\d{2})?/g)]
  if (matches.length < 2) return undefined
  const [start, end] = matches
  const fmt = (h: string, m: string | undefined) => `${h.padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`
  return [fmt(start[1], start[2]), fmt(end[1], end[2])]
}

export function buildHairSalonJsonLd(copy: SiteCopy): object {
  const { postalCode, addressLocality } = parseAddress(copy.contactAddress)
  const priceRange = priceRangeFrom(copy)
  const morning = parseTimeRange(copy.horaireMatin)
  const afternoon = parseTimeRange(copy.horaireApresMidi)
  const dayOfWeek = JOURS.map((jour) => JOURS_SCHEMA_ORG[jour])

  const openingHoursSpecification = [
    ...(morning
      ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek, opens: morning[0], closes: morning[1] }]
      : []),
    ...(afternoon
      ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek, opens: afternoon[0], closes: afternoon[1] }]
      : []),
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: copy.contactBusiness,
    description: copy.heroTagline,
    url: SITE_URL,
    telephone: toInternationalPhone(copy.contactPhone),
    image: `${SITE_URL}/content-images/patricia-portrait.jpg`,
    address: {
      '@type': 'PostalAddress',
      ...(postalCode ? { postalCode } : {}),
      addressLocality,
      addressCountry: 'CH',
    },
    areaServed: SERVICE_AREA_TOWNS.map((name) => ({ '@type': 'City', name })),
    ...(priceRange ? { priceRange } : {}),
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
  }
}
