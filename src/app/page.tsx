import { EditableCopy } from '@/components/EditableCopy'
import { EditableImage } from '@/components/EditableImage'
import { ProductCarousel } from '@/components/ProductCarousel'
import { buttonVariants } from '@/lib/button-variants'
import { getSiteCopy } from '@/lib/content'
import { cn } from '@/lib/utils'

const CAROUSEL_ITEMS = [
  { name: 'carousel-1.jpg', alt: 'Coiffure réalisée par Patricia' },
  { name: 'carousel-2.jpg', alt: 'Coiffure réalisée par Patricia' },
  { name: 'carousel-3.jpg', alt: 'Coiffure réalisée par Patricia' },
  { name: 'carousel-4.jpg', alt: 'Coiffure réalisée par Patricia' },
  { name: 'carousel-5.png', alt: 'Capsules H-force' },
  { name: 'carousel-6.png', alt: 'Colorsave' },
  { name: 'carousel-7.png', alt: 'Equilibrium' },
  { name: 'carousel-8.png', alt: 'Nourishing' },
  { name: 'carousel-9.png', alt: "Shampoing Pur et Après-Shampooing Pur" },
  { name: 'carousel-10.png', alt: 'Shampoing Sea Force et Lotion Anti-Chute Sea Force' },
  { name: 'carousel-11.png', alt: 'Shampooing au Sébum' },
  { name: 'carousel-12.png', alt: 'Shampooing Blond Brillant' },
]

const TARIFS = [
  { key: 'tarifDames', label: 'Dames' },
  { key: 'tarifHommes', label: 'Hommes' },
  { key: 'tarifTondeuse', label: 'Coupe tondeuse' },
  { key: 'tarifEnfants', label: 'Enfants' },
  { key: 'tarifDeplacement', label: 'Supplément déplacement' },
  { key: 'tarifShampoingSechage', label: 'Shampoing + séchage uniquement' },
] as const

const JOURS = ['Mardi', 'Mercredi', 'Vendredi']

export default async function HomePage() {
  const copy = await getSiteCopy()

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <EditableImage name="logo.jpg" alt="Coupe à tout f'HAIR" className="h-10 w-auto rounded object-contain" />
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <a href="#about" className="text-muted-foreground hover:text-foreground">
              Qui je suis
            </a>
            <a href="#tarifs" className="text-muted-foreground hover:text-foreground">
              Tarifs
            </a>
            <a href="#horaires" className="text-muted-foreground hover:text-foreground">
              Horaires
            </a>
          </nav>
          <a href="#contact" className={cn(buttonVariants({ variant: 'default' }))}>
            Contactez-moi
          </a>
        </div>
      </header>

      {/* Hero */}
      <section>
        <EditableImage
          name="hero-banner.jpg"
          alt="Coupe à tout f'HAIR — coiffeuse itinérante, se déplace chez vous"
          className="h-[45vh] w-full object-cover sm:h-[60vh]"
        />
      </section>

      {/* About */}
      <section id="about" className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold tracking-tight">Qui je suis</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-center text-lg font-semibold">Mon Parcours</h3>
              <EditableCopy
                as="p"
                copyKey="aboutParcours"
                value={copy.aboutParcours}
                multiline
                className="mt-3 block text-sm leading-relaxed text-muted-foreground"
              />
            </div>
            <div>
              <h3 className="text-center text-lg font-semibold">Une Coiffure Naturelle</h3>
              <EditableCopy
                as="p"
                copyKey="aboutNaturelle"
                value={copy.aboutNaturelle}
                multiline
                className="mt-3 block text-sm leading-relaxed text-muted-foreground"
              />
            </div>
            <div>
              <h3 className="text-center text-lg font-semibold">Un Moment Humain</h3>
              <EditableCopy
                as="p"
                copyKey="aboutHumain"
                value={copy.aboutHumain}
                multiline
                className="mt-3 block text-sm leading-relaxed text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-primary px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold tracking-tight text-primary-foreground">
            Produits et Soins
          </h2>
          <div className="mt-12">
            <ProductCarousel items={CAROUSEL_ITEMS} />
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="bg-muted px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-semibold tracking-tight">Ma vie</h2>
          <div className="mx-auto mt-8 aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              src="https://player.vimeo.com/video/896607251?h=443abab20d"
              allowFullScreen
              className="h-full w-full"
              title="Ma vie"
            />
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-xl font-semibold tracking-tight">Tarifs</h2>
          <ul className="mt-10 divide-y divide-border border-t border-border">
            {TARIFS.map(({ key, label }) => (
              <li key={key} className="flex flex-wrap items-baseline gap-x-2 py-3 text-sm">
                <span className="font-semibold">{label} :</span>
                <EditableCopy copyKey={key} value={copy[key]} className="text-muted-foreground" />
              </li>
            ))}
            <li className="flex flex-wrap items-baseline gap-x-2 py-3 text-sm text-destructive">
              <EditableCopy copyKey="tarifAnnulation" value={copy.tarifAnnulation} />
            </li>
          </ul>
        </div>
      </section>

      {/* Horaires */}
      <section id="horaires" className="bg-muted px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-xl font-semibold tracking-tight">Horaires</h2>
          <div className="mt-10 overflow-x-auto rounded-lg border border-border bg-background">
            <table className="w-full table-fixed text-center text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-3 py-2 font-semibold">Jour</th>
                  <th className="px-3 py-2 font-semibold">Matin</th>
                  <th className="px-3 py-2 font-semibold">Après-midi</th>
                </tr>
              </thead>
              <tbody>
                {JOURS.map((jour) => (
                  <tr key={jour} className="border-t border-border">
                    <td className="px-3 py-2">{jour}</td>
                    <td className="px-3 py-2 text-muted-foreground">{copy.horaireMatin}</td>
                    <td className="px-3 py-2 text-muted-foreground">{copy.horaireApresMidi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 space-y-2 text-center text-sm">
            <p>
              <span className="font-semibold">Zone : </span>
              <EditableCopy copyKey="horaireZone" value={copy.horaireZone} className="text-muted-foreground" />
            </p>
            <EditableCopy
              as="p"
              copyKey="horaireNote"
              value={copy.horaireNote}
              className="block text-muted-foreground"
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
          <div className="mt-8 space-y-2 text-sm">
            <EditableCopy as="p" copyKey="contactName" value={copy.contactName} className="block font-semibold" />
            <p className="text-muted-foreground">
              <EditableCopy copyKey="contactBusiness" value={copy.contactBusiness} />
              <br />
              <EditableCopy copyKey="contactAddress" value={copy.contactAddress} />
            </p>
            <p>
              <span className="font-semibold">Téléphone : </span>
              <a href={`tel:${copy.contactPhone.replace(/\s/g, '')}`} className="text-primary hover:underline">
                <EditableCopy copyKey="contactPhone" value={copy.contactPhone} />
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground px-4 py-8 text-center text-sm text-background">
        <EditableCopy copyKey="footerText" value={copy.footerText} />
      </footer>
    </>
  )
}
