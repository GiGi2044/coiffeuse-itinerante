// Structural data for the homepage (src/app/page.tsx). Labels here are fixed
// page structure, not admin-editable content — only the values pulled from
// SiteCopy are.

// Candid photos of Patricia and her work — shown in "Ma vie", not the
// products carousel (which should only ever show product photography).
export const WORK_PHOTOS = [
  { name: 'carousel-1.jpg', alt: 'Patricia et son véhicule équipé' },
  { name: 'carousel-2.jpg', alt: "Patricia lors d'une coupe à domicile" },
  { name: 'carousel-3.jpg', alt: 'Patricia et son matériel de coiffeuse itinérante' },
  { name: 'carousel-4.jpg', alt: 'Patricia en plein brushing chez une cliente' },
  { name: 'equipment.jpg', alt: 'Le matériel mobile de Patricia — bac de lavage et chariot qu\'elle amène chez vous' },
] as const

export const CAROUSEL_ITEMS = [
  { name: 'carousel-5.jpg', alt: 'TogetHair H-Force — complément alimentaire capillaire' },
  { name: 'carousel-6.jpg', alt: 'TogetHair Chromacare — shampoing protecteur pour cheveux colorés' },
  { name: 'carousel-7.jpg', alt: 'TogetHair Equilibrium — shampoing anti-pelliculaire' },
  { name: 'carousel-8.jpg', alt: 'TogetHair Nutriplenia — shampoing nourrissant pour cheveux secs' },
  { name: 'carousel-9.jpg', alt: 'TogetHair Pure — shampoing pour cheveux naturels' },
  { name: 'carousel-10.jpg', alt: 'TogetHair Sea Force — shampoing anti-chute' },
  { name: 'carousel-11.jpg', alt: 'TogetHair Sebum — shampoing pour cheveux gras et mixtes' },
  { name: 'carousel-12.jpg', alt: 'TogetHair Shine Blonde — shampoing anti-jaunissement' },
] as const

export const TARIFS = [
  { key: 'tarifDames', label: 'Dames' },
  { key: 'tarifHommes', label: 'Hommes' },
  { key: 'tarifTondeuse', label: 'Coupe tondeuse' },
  { key: 'tarifEnfants', label: 'Enfants' },
  { key: 'tarifDeplacement', label: 'Supplément déplacement' },
  { key: 'tarifShampoingSechage', label: 'Shampoing + séchage uniquement' },
] as const

export const JOURS = ['Mardi', 'Mercredi', 'Vendredi'] as const
