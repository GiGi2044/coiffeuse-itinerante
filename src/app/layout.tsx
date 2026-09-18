import type { Metadata } from 'next'
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
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

export const metadata: Metadata = {
  title: "Coiffeuse Itinérante | Patricia",
  description:
    "Coiffeuse itinérante à Fribourg — coupes, brushings et soins à domicile avec Patricia Beuret.",
  openGraph: {
    siteName: "Coupe à tout f'HAIR",
    type: 'website',
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
