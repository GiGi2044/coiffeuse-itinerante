import { ClockIcon, PhoneIcon, TagIcon, UserIcon } from 'lucide-react'
import { EditableCopy } from '@/components/EditableCopy'
import { GuardedLink } from '@/components/GuardedLink'
import type { SiteCopy } from '@/types'

// Bottom tab bar for mobile only (≤4 destinations, per design convention) —
// the header's horizontal nav is hidden below `sm`, so this is the only way
// to jump between sections on a phone. `env(safe-area-inset-bottom)` keeps it
// clear of the home indicator on notched phones.
export function MobileNav({ copy }: { copy: SiteCopy }) {
  const items = [
    { href: '#about', copyKey: 'navAbout' as const, value: copy.navAbout, Icon: UserIcon },
    { href: '#tarifs', copyKey: 'navTarifs' as const, value: copy.navTarifs, Icon: TagIcon },
    { href: '#horaires', copyKey: 'navHoraires' as const, value: copy.navHoraires, Icon: ClockIcon },
    { href: '#contact', copyKey: 'navContact' as const, value: copy.navContact, Icon: PhoneIcon },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, copyKey, value, Icon }) => (
          <li key={href}>
            <GuardedLink
              href={href}
              className="flex min-h-11 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-[11px] leading-none">
                <EditableCopy copyKey={copyKey} value={value} />
              </span>
            </GuardedLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
