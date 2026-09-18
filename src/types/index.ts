export interface SiteCopy {
  aboutParcours: string
  aboutNaturelle: string
  aboutHumain: string
  tarifDames: string
  tarifHommes: string
  tarifTondeuse: string
  tarifEnfants: string
  tarifDeplacement: string
  tarifShampoingSechage: string
  tarifAnnulation: string
  horaireJours: string
  horaireMatin: string
  horaireApresMidi: string
  horaireZone: string
  horaireNote: string
  contactName: string
  contactBusiness: string
  contactAddress: string
  contactPhone: string
  footerText: string
}

export interface EditableFile {
  path: string
  kind: 'copy'
  livePath: string
}
