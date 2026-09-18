// Structural data for the homepage (src/components/SiteContent.tsx) that
// isn't admin-editable content — the three days share identical hours, so
// this list of day names is fixed page structure, not something that grows
// or shrinks from the editor the way tarifs/carouselItems/workPhotos do.
export const JOURS = ['Mardi', 'Mercredi', 'Vendredi'] as const
