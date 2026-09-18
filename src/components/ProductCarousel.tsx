'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { EditableImage } from '@/components/EditableImage'

interface CarouselItem {
  name: string
  alt: string
}

type FlickityCtor = new (el: HTMLElement, options: Record<string, unknown>) => unknown

export function ProductCarousel({ items }: { items: CarouselItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<unknown>(null)

  function init() {
    const Flickity = (window as unknown as { Flickity?: FlickityCtor }).Flickity
    if (!Flickity || !ref.current || instanceRef.current) return
    instanceRef.current = new Flickity(ref.current, {
      wrapAround: true,
      autoPlay: 5000,
      pageDots: true,
      cellAlign: 'center',
      contain: true,
    })
  }

  // onReady (not onLoad) fires both after the initial script load and on every
  // remount, so the carousel initializes even if the script was already cached.
  useEffect(() => {
    init()
  }, [])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/flickity@2/dist/flickity.min.css" />
      <Script
        src="https://unpkg.com/flickity@2/dist/flickity.pkgd.min.js"
        strategy="afterInteractive"
        onReady={init}
      />
      <div ref={ref} className="flickity-carousel">
        {items.map((item) => (
          <div key={item.name} className="carousel-cell mr-4 w-64 shrink-0 sm:w-80">
            <EditableImage
              name={item.name}
              alt={item.alt}
              className="aspect-square w-full rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    </>
  )
}
