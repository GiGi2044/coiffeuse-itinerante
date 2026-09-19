'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, MessageSquareIcon, StarIcon } from 'lucide-react'
import { AddListItemButton, RemoveListItemButton } from '@/components/admin/ListControls'
import { EditableCopy } from '@/components/EditableCopy'
import { SectionHeading } from '@/components/SectionHeading'
import { useEditMode } from '@/lib/edit-mode'
import { cn } from '@/lib/utils'
import type { Review } from '@/types'

// Read-only stars on the public page; clickable in the admin editor (each
// star sets the rating directly — no contentEditable text box for a number).
function StarRating({ id, rating }: { id: string; rating: number }) {
  const { editable, setListField } = useEditMode()
  const star = (n: number) => (
    <StarIcon
      key={n}
      aria-hidden
      className={cn('size-4', n <= rating ? 'fill-primary text-primary' : 'fill-none text-muted-foreground/30')}
    />
  )

  if (!editable) {
    return (
      <div className="flex shrink-0 gap-0.5" role="img" aria-label={`${rating} sur 5 étoiles`}>
        {[1, 2, 3, 4, 5].map(star)}
      </div>
    )
  }

  return (
    <div className="flex shrink-0 gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Noter ${n} sur 5`}
          onClick={() => setListField('reviews', id, 'rating', String(n))}
          className="cursor-pointer outline-offset-4"
        >
          {star(n)}
        </button>
      ))}
    </div>
  )
}

// Card contents shared by all three passes below (clone / real / clone) —
// fixed height so cards line up regardless of review length; a long review
// scrolls inside its own card instead of stretching every card in the row
// to match the tallest one.
function ReviewCardBody({ review }: { review: Review }) {
  return (
    <>
      <StarRating id={review.id} rating={review.rating} />
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <EditableCopy
          as="p"
          value={review.text}
          listTarget={{ list: 'reviews', id: review.id, field: 'text' }}
          multiline
          className="block text-sm leading-relaxed text-muted-foreground"
        />
      </div>
      <p className="mt-3 shrink-0 text-sm font-medium text-foreground">
        — <EditableCopy value={review.author} listTarget={{ list: 'reviews', id: review.id, field: 'author' }} />
      </p>
    </>
  )
}

const CARD_CLASS =
  'group relative flex h-64 w-72 shrink-0 snap-start flex-col rounded-lg border border-border bg-card p-6 sm:w-80'

// Hidden entirely on the public page until Patricia adds a first review — a
// "0 avis" panel would look worse than no section at all for real visitors.
// In the admin editor it always shows, with a designed empty state prompting
// her to paste in her first Google review.
export function ReviewsSection({ heading, reviews }: { heading: string; reviews: Review[] }) {
  const { editable } = useEditMode()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const setWidthRef = useRef(0)

  // Infinite loop, same technique as ImageCarousel: the review list is
  // rendered three times back-to-back (clone, real set, clone), starting
  // scrolled to the real set in the middle — so left/right never hit a dead
  // end no matter how many times they're pressed.
  function measureAndCenter() {
    const el = scrollerRef.current
    const marker = markerRef.current
    if (!el || !marker) return
    const setWidth = marker.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft
    setWidthRef.current = setWidth
    if (setWidth > 0) {
      el.scrollLeft = setWidth
      void el.offsetHeight
    }
  }

  useEffect(() => {
    const raf = requestAnimationFrame(measureAndCenter)
    window.addEventListener('resize', measureAndCenter)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measureAndCenter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews])

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

  if (reviews.length === 0 && !editable) return null

  function nudge(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    const cardWidth = el.querySelector<HTMLElement>('[data-review-card]')?.clientWidth ?? 320
    el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' })
  }

  return (
    <section id="avis" className="scroll-mt-20 border-y border-border bg-secondary px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionHeading>
          <EditableCopy copyKey="headingRetours" value={heading} />
        </SectionHeading>

        {reviews.length === 0 ? (
          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <MessageSquareIcon className="size-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium text-foreground">Aucun avis pour l&apos;instant</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Copiez-collez ici les avis Google de vos clientes — nom, note et texte.
            </p>
            <AddListItemButton list="reviews" label="Ajouter votre premier avis" />
          </div>
        ) : (
          <>
            <div className="relative mt-12">
              <div
                ref={scrollerRef}
                className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
              >
                {reviews.map((review) => (
                  <div key={`before-${review.id}`} data-review-card aria-hidden className={CARD_CLASS}>
                    <ReviewCardBody review={review} />
                  </div>
                ))}
                {reviews.map((review, i) => (
                  <div
                    key={`real-${review.id}`}
                    ref={i === 0 ? markerRef : undefined}
                    data-review-card
                    className={CARD_CLASS}
                  >
                    <RemoveListItemButton list="reviews" id={review.id} />
                    <ReviewCardBody review={review} />
                  </div>
                ))}
                {reviews.map((review) => (
                  <div key={`after-${review.id}`} data-review-card aria-hidden className={CARD_CLASS}>
                    <ReviewCardBody review={review} />
                  </div>
                ))}
              </div>

              {reviews.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Avis précédent"
                    onClick={() => nudge(-1)}
                    className="absolute top-1/2 left-0 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-secondary sm:flex"
                  >
                    <ChevronLeftIcon className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Avis suivant"
                    onClick={() => nudge(1)}
                    className="absolute top-1/2 right-0 hidden size-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-secondary sm:flex"
                  >
                    <ChevronRightIcon className="size-5" aria-hidden />
                  </button>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-center">
              <AddListItemButton list="reviews" label="Ajouter un avis" />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
