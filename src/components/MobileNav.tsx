import { ClockIcon, PhoneIcon, TagIcon, UserIcon } from 'lucide-react'

const ITEMS = [
  { href: '#about', label: 'Qui je suis', Icon: UserIcon },
  { href: '#tarifs', label: 'Tarifs', Icon: TagIcon },
  { href: '#horaires', label: 'Horaires', Icon: ClockIcon },
  { href: '#contact', label: 'Contact', Icon: PhoneIcon },
] as const

// Bottom tab bar for mobile only (≤4 destinations, per design convention) —
// the header's horizontal nav is hidden below `sm`, so this is the only way
// to jump between sections on a phone. `env(safe-area-inset-bottom)` keeps it
// clear of the home indicator on notched phones.
export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, Icon }) => (
          <li key={href}>
            <a
              href={href}
              className="flex min-h-11 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-[11px] leading-none">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
