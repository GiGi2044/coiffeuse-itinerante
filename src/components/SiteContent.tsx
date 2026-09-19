import { AddListItemButton, RemoveListItemButton } from '@/components/admin/ListControls'
import { EditableCopy } from '@/components/EditableCopy'
import { EditableImage } from '@/components/EditableImage'
import { GuardedLink } from '@/components/GuardedLink'
import { ImageCarousel } from '@/components/ImageCarousel'
import { MobileNav } from '@/components/MobileNav'
import { buttonVariants } from '@/lib/button-variants'
import { LightboxProvider } from '@/lib/lightbox'
import { JOURS } from '@/lib/site-data'
import { cn } from '@/lib/utils'
import type { SiteCopy } from '@/types'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl text-foreground italic sm:text-3xl">{children}</h2>
      <div className="mx-auto mt-3 h-px w-10 bg-primary/70" />
    </div>
  )
}

// The whole homepage, as a plain component driven entirely by its `copy` prop.
// Rendered two ways: the public route (`src/app/page.tsx`) passes server-fetched
// copy with no EditModeProvider above it, so it's always static. The admin
// editor (`src/components/admin/AdminEditor.tsx`) passes locally-staged draft copy
// inside an EditModeProvider, so every EditableCopy/EditableImage in this same
// tree becomes click-to-edit — that's what makes "the admin page look like the
// page" true by construction rather than by duplicated markup.
export function SiteContent({ copy }: { copy: SiteCopy }) {
  const telHref = `tel:${copy.contactPhone.replace(/\s/g, '')}`

  return (
    <LightboxProvider>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <EditableImage name="logo.jpg" alt="Coupe à tout f'HAIR" className="h-9 w-auto rounded object-contain" />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
            <GuardedLink href="#about" className="hover:text-foreground">
              <EditableCopy copyKey="navAbout" value={copy.navAbout} />
            </GuardedLink>
            <GuardedLink href="#tarifs" className="hover:text-foreground">
              <EditableCopy copyKey="navTarifs" value={copy.navTarifs} />
            </GuardedLink>
            <GuardedLink href="#horaires" className="hover:text-foreground">
              <EditableCopy copyKey="navHoraires" value={copy.navHoraires} />
            </GuardedLink>
          </nav>
          <GuardedLink href="#contact" className={cn(buttonVariants({ variant: 'default' }), 'h-9 px-4')}>
            <EditableCopy copyKey="ctaContact" value={copy.ctaContact} />
          </GuardedLink>
        </div>
      </header>

      {/* Hero — real text (crisp, editable, never clipped) beside a small,
          contained decorative graphic (never upscaled past its native size,
          so it stays sharp at every breakpoint from 375px up). */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Coiffeuse itinérante
            </p>
            <h1 className="font-display mt-4 text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
              <EditableCopy copyKey="contactBusiness" value={copy.contactBusiness} />
            </h1>
            <EditableCopy
              as="p"
              copyKey="heroTagline"
              value={copy.heroTagline}
              className="mt-5 block max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
            />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GuardedLink href={telHref} className={cn(buttonVariants({ variant: 'default' }), 'h-10 px-5')}>
                <EditableCopy copyKey="contactPhone" value={copy.contactPhone} />
              </GuardedLink>
              <GuardedLink href="#tarifs" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
                <EditableCopy copyKey="ctaTarifs" value={copy.ctaTarifs} />
              </GuardedLink>
            </div>
          </div>
          <div className="mx-auto w-full min-w-0 max-w-sm md:max-w-none">
            <EditableImage name="hero-wave.png" alt="" className="h-auto w-full object-contain" />
          </div>
        </div>
      </section>

      {/* About — one flowing column, hairline dividers instead of boxed cards.
          Alternates with a slightly deeper faded-pink panel so each section
          reads as distinct without boxes or shadows. */}
      <section id="about" className="scroll-mt-20 border-y border-border bg-secondary px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <SectionHeading>
            <EditableCopy copyKey="headingAbout" value={copy.headingAbout} />
          </SectionHeading>
          <div className="mt-12 divide-y divide-border">
            <div className="pb-8">
              <h3 className="font-display text-lg text-foreground italic">Mon Parcours</h3>
              <EditableCopy
                as="p"
                copyKey="aboutParcours"
                value={copy.aboutParcours}
                multiline
                className="mt-3 block text-sm leading-relaxed text-muted-foreground sm:text-base"
              />
            </div>
            <div className="py-8">
              <h3 className="font-display text-lg text-foreground italic">Une Coiffure Naturelle</h3>
              <EditableCopy
                as="p"
                copyKey="aboutNaturelle"
                value={copy.aboutNaturelle}
                multiline
                className="mt-3 block text-sm leading-relaxed text-muted-foreground sm:text-base"
              />
            </div>
            <div className="pt-8">
              <h3 className="font-display text-lg text-foreground italic">Un Moment Humain</h3>
              <EditableCopy
                as="p"
                copyKey="aboutHumain"
                value={copy.aboutHumain}
                multiline
                className="mt-3 block text-sm leading-relaxed text-muted-foreground sm:text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products — plain base panel (alternates against About/Video) */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <SectionHeading>
            <EditableCopy copyKey="headingProducts" value={copy.headingProducts} />
          </SectionHeading>
          <div className="mt-12">
            <ImageCarousel items={copy.carouselItems} listKey="carouselItems" />
            <div className="mt-4 flex justify-center">
              <AddListItemButton list="carouselItems" label="Ajouter une photo produit" />
            </div>
          </div>
        </div>
      </section>

      {/* Video + photo carousel — alternates with a deeper faded-pink panel */}
      <section className="border-y border-border bg-secondary px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading>
            <EditableCopy copyKey="headingMaVie" value={copy.headingMaVie} />
          </SectionHeading>
          <div className="mx-auto mt-10 aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              src="https://player.vimeo.com/video/896607251?h=443abab20d"
              allowFullScreen
              className="h-full w-full"
              title="Ma vie"
            />
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-5xl">
          <ImageCarousel
            items={copy.workPhotos}
            cardClassName="w-72 shrink-0 sm:w-96"
            imageClassName="aspect-[3/4] w-full object-cover"
            listKey="workPhotos"
          />
          <div className="mt-4 flex justify-center">
            <AddListItemButton list="workPhotos" label="Ajouter une photo" />
          </div>
        </div>
      </section>

      {/* Tarifs — hairline list, price in the accent color; plain panel (alternates against Video/Horaires) */}
      <section id="tarifs" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <SectionHeading>
            <EditableCopy copyKey="headingTarifs" value={copy.headingTarifs} />
          </SectionHeading>
          <ul className="mt-12 divide-y divide-border">
            {copy.tarifs.map((tarif) => (
              <li
                key={tarif.id}
                className="group relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 pr-8 text-sm"
              >
                <EditableCopy
                  value={tarif.label}
                  listTarget={{ list: 'tarifs', id: tarif.id, field: 'label' }}
                  className="text-foreground"
                />
                <EditableCopy
                  value={tarif.price}
                  listTarget={{ list: 'tarifs', id: tarif.id, field: 'price' }}
                  className="text-right font-medium text-primary tabular-nums"
                />
                <div className="absolute top-1/2 right-0 -translate-y-1/2">
                  <RemoveListItemButton list="tarifs" id={tarif.id} />
                </div>
              </li>
            ))}
            <li className="flex flex-wrap items-baseline gap-x-2 py-4 text-sm text-destructive">
              <EditableCopy copyKey="tarifAnnulation" value={copy.tarifAnnulation} />
            </li>
          </ul>
          <div className="mt-4">
            <AddListItemButton list="tarifs" label="Ajouter un tarif" />
          </div>
        </div>
      </section>

      {/* Horaires — same hairline treatment as Tarifs, no boxed table; alternates with a deeper faded-pink panel */}
      <section id="horaires" className="scroll-mt-20 border-y border-border bg-secondary px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <SectionHeading>
            <EditableCopy copyKey="headingHoraires" value={copy.headingHoraires} />
          </SectionHeading>
          <table className="mt-12 w-full text-center text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pb-3 font-medium">Jour</th>
                <th className="pb-3 font-medium">Matin</th>
                <th className="pb-3 font-medium">Après-midi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {JOURS.map((jour) => (
                <tr key={jour}>
                  <td className="py-3 font-medium text-foreground">{jour}</td>
                  <td className="py-3 text-muted-foreground tabular-nums">
                    <EditableCopy copyKey="horaireMatin" value={copy.horaireMatin} />
                  </td>
                  <td className="py-3 text-muted-foreground tabular-nums">
                    <EditableCopy copyKey="horaireApresMidi" value={copy.horaireApresMidi} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 space-y-2 text-center text-sm">
            <p>
              <span className="font-medium text-foreground">Zone : </span>
              <EditableCopy copyKey="horaireZone" value={copy.horaireZone} className="text-muted-foreground" />
            </p>
            <EditableCopy
              as="p"
              copyKey="horaireNote"
              value={copy.horaireNote}
              className="block text-muted-foreground"
            />
            {copy.horaireExtraNotes.map((note) => (
              <p key={note.id} className="group relative inline-block">
                <EditableCopy
                  listTarget={{ list: 'horaireExtraNotes', id: note.id, field: 'text' }}
                  value={note.text}
                  className="text-muted-foreground"
                />
                <RemoveListItemButton list="horaireExtraNotes" id={note.id} />
              </p>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <AddListItemButton list="horaireExtraNotes" label="Ajouter une ligne" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-xl text-center">
          <SectionHeading>
            <EditableCopy copyKey="headingContact" value={copy.headingContact} />
          </SectionHeading>
          <div className="mt-10 space-y-2 text-sm">
            <EditableCopy as="p" copyKey="contactName" value={copy.contactName} className="block font-medium text-foreground" />
            <p className="text-muted-foreground">
              <EditableCopy copyKey="contactBusiness" value={copy.contactBusiness} />
              <br />
              <EditableCopy copyKey="contactAddress" value={copy.contactAddress} />
            </p>
            <p>
              <span className="font-medium text-foreground">Téléphone : </span>
              <GuardedLink href={telHref} className="text-primary hover:underline">
                <EditableCopy copyKey="contactPhone" value={copy.contactPhone} />
              </GuardedLink>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-center text-sm text-background sm:pb-8">
        <EditableCopy copyKey="footerText" value={copy.footerText} />
      </footer>

      {/* Fixed on mobile only — reserve the space so it never overlaps content */}
      <div className="h-16 sm:hidden" style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }} />
      <MobileNav copy={copy} />
    </LightboxProvider>
  )
}
