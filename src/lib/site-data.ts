// Structural data for the homepage (src/components/SiteContent.tsx) that
// isn't admin-editable content — the three days share identical hours, so
// this list of day names is fixed page structure, not something that grows
// or shrinks from the editor the way tarifs/carouselItems/workPhotos do.
export const JOURS = ['Mardi', 'Mercredi', 'Vendredi'] as const

// French day name → schema.org DayOfWeek enum, paired 1:1 with JOURS.
export const JOURS_SCHEMA_ORG: Record<(typeof JOURS)[number], string> = {
  Mardi: 'Tuesday',
  Mercredi: 'Wednesday',
  Vendredi: 'Friday',
}

// The production domain — canonical URL, sitemap, robots.txt, and
// structured data all read from this single constant.
export const SITE_URL = 'https://coiffeuse-itinerante.ch'

// Same towns as the "Zone de déplacement" map (src/components/ServiceAreaMap.tsx)
// — kept as plain names here since structured data (areaServed) just needs
// the list, not the geocoded coordinates used to draw the circle.
export const SERVICE_AREA_TOWNS = [
  'Fribourg',
  'Le Mouret',
  'La Roche',
  'Rossens',
  'Gibloux',
  'Lentigny',
  'Grolley',
  'Courtepin',
] as const
