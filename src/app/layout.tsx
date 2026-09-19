import type { Metadata } from 'next'
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { SITE_URL } from '@/lib/site-data'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '600', '800'],
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
})

const TITLE = "Coupe à tout f'HAIR — Coiffeuse itinérante à Fribourg | Patricia Beuret"
const DESCRIPTION =
  "Coiffeuse itinérante à domicile dans la région de Fribourg (Le Mouret, La Roche, Rossens, Gibloux, Lentigny, Grolley, Courtepin). Coupes, brushings et soins avec Patricia Beuret."
const OG_IMAGE = `${SITE_URL}/content-images/patricia-portrait.jpg`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'coiffeuse itinérante',
    'coiffeuse à domicile',
    'coiffeur à domicile Fribourg',
    'Patricia Beuret',
    "Coupe à tout f'HAIR",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Coupe à tout f'HAIR",
    type: 'website',
    locale: 'fr_CH',
    images: [{ url: OG_IMAGE, width: 1142, height: 1600, alt: 'Patricia Beuret, coiffeuse itinérante' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${newsreader.variable} antialiased`}>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
