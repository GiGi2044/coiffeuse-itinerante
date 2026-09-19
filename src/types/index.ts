export interface TarifItem {
  id: string
  label: string
  price: string
}

export interface CarouselImage {
  id: string
  name: string
  alt: string
}

export interface NoteItem {
  id: string
  text: string
}

export interface Review {
  id: string
  author: string
  rating: number
  text: string
}

export interface SiteCopy {
  heroTagline: string
  aboutParcours: string
  aboutNaturelle: string
  aboutHumain: string
  tarifAnnulation: string
  horaireMatin: string
  horaireApresMidi: string
  horaireZone: string
  horaireNote: string
  contactName: string
  contactBusiness: string
  contactAddress: string
  contactPhone: string
  footerText: string
  headingAbout: string
  headingProducts: string
  headingMaVie: string
  headingTarifs: string
  headingHoraires: string
  headingZone: string
  zoneNote: string
  headingContact: string
  headingRetours: string
  navAbout: string
  navTarifs: string
  navHoraires: string
  navZone: string
  navContact: string
  ctaContact: string
  ctaTarifs: string
  tarifs: TarifItem[]
  carouselItems: CarouselImage[]
  workPhotos: CarouselImage[]
  horaireExtraNotes: NoteItem[]
  reviews: Review[]
}

export interface EditableFile {
  path: string
  kind: 'copy'
  livePath: string
}
