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
  headingContact: string
  navAbout: string
  navTarifs: string
  navHoraires: string
  navContact: string
  ctaContact: string
  ctaTarifs: string
  tarifs: TarifItem[]
  carouselItems: CarouselImage[]
  workPhotos: CarouselImage[]
}

export interface EditableFile {
  path: string
  kind: 'copy'
  livePath: string
}
