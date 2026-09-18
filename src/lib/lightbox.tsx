'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { XIcon } from 'lucide-react'

interface LightboxImage {
  src: string
  alt: string
}

interface LightboxContextValue {
  open: (image: LightboxImage) => void
}

const LightboxContext = createContext<LightboxContextValue>({ open: () => {} })

export function useLightbox(): LightboxContextValue {
  return useContext(LightboxContext)
}

// One shared full-size viewer for every clickable photo on the page (see
// ImageCarousel). Closes on backdrop click, the × button, or Escape — never
// on clicking the image itself, so a mis-click doesn't dismiss it.
export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<LightboxImage | null>(null)

  useEffect(() => {
    if (!image) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setImage(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [image])

  return (
    <LightboxContext.Provider value={{ open: setImage }}>
      {children}
      {image && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={image.alt || 'Photo agrandie'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
          onClick={() => setImage(null)}
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setImage(null)}
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <XIcon className="size-5" aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </LightboxContext.Provider>
  )
}
