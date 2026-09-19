import { cn } from '@/lib/utils'

// `invert` is for a dark panel (bg-foreground, like the footer) — swaps the
// heading text to text-background so it stays legible.
export function SectionHeading({ children, invert = false }: { children: React.ReactNode; invert?: boolean }) {
  return (
    <div className="text-center">
      <h2 className={cn('font-display text-2xl italic sm:text-3xl', invert ? 'text-background' : 'text-foreground')}>
        {children}
      </h2>
      <div className="mx-auto mt-3 h-px w-10 bg-primary/70" />
    </div>
  )
}
