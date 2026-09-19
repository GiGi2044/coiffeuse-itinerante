export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl text-foreground italic sm:text-3xl">{children}</h2>
      <div className="mx-auto mt-3 h-px w-10 bg-primary/70" />
    </div>
  )
}
