'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { EditableImage } from '@/components/EditableImage'

interface CarouselItem {
  name: string
  alt: string
}

interface ImageCarouselProps {
  items: readonly CarouselItem[]
  /** Sizes each card (width, shrink) — defaults to the product-photo size. */
  cardClassName?: string
  /** Sizes/crops each photo — defaults to a square product-style crop. */
  imageClassName?: string
}

// Manual-only carousel — no autoplay. The arrow buttons can be pressed any
// number of times in either direction and it always keeps going: the item
// list is rendered three times back-to-back (a clone, the real set, another
// clone), starting scrolled to the real set in the middle. Whenever scroll
// position drifts into either clone, it's stepped by exactly one set's width
// back into the equivalent spot in the real set — since the clones are
// pixel-identical, that correction is invisible, so left/right never hit a
// dead end no matter how many times you click.
export function ImageCarousel({
  items,
  cardClassName = 'w-64 shrink-0 sm:w-80',
  imageClassName = 'aspect-square w-full rounded-lg object-cover',
}: ImageCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const setWidthRef = useRef(0)

  function measureAndCenter() {
    const el = scrollerRef.current
    const marker = markerRef.current
    if (!el || !marker) return
    const setWidth = marker.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft
    setWidthRef.current = setWidth
    if (setWidth > 0) el.scrollLeft = setWidth
  }

  useEffect(() => {
    measureAndCenter()
    window.addEventListener('resize', measureAndCenter)
    return () => window.removeEventListener('resize', measureAndCenter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // Wrap seamlessly whenever scroll drifts into either clone — from a button
  // nudge or a manual swipe/trackpad scroll alike.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    function onScroll() {
      const setWidth = setWidthRef.current
      if (!el || setWidth <= 0) return
      if (el.scrollLeft < setWidth) el.scrollLeft += setWidth
      else if (el.scrollLeft >= setWidth * 2) el.scrollLeft -= setWidth
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function nudge(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    const cardWidth = el.querySelector('[data-carousel-cell]')?.clientWidth ?? 280
    el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div ref={scrollerRef} className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {items.map((item) => (
          <div key={`before-${item.name}`} data-carousel-cell aria-hidden className={cardClassName}>
            <EditableImage name={item.name} alt="" className={imageClassName} />
          </div>
        ))}
        {items.map((item, i) => (
          <div
            key={`real-${item.name}`}
            ref={i === 0 ? markerRef : undefined}
            data-carousel-cell
            className={cardClassName}
          >
            <EditableImage name={item.name} alt={item.alt} className={imageClassName} />
          </div>
        ))}
        {items.map((item) => (
          <div key={`after-${item.name}`} data-carousel-cell aria-hidden className={cardClassName}>
            <EditableImage name={item.name} alt="" className={imageClassName} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Photo précédente"
        onClick={() => nudge(-1)}
        className="absolute top-1/2 left-0 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-secondary sm:flex"
      >
        <ChevronLeftIcon className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Photo suivante"
        onClick={() => nudge(1)}
        className="absolute top-1/2 right-0 hidden size-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-secondary sm:flex"
      >
        <ChevronRightIcon className="size-5" aria-hidden />
      </button>
    </div>
  )
}
