'use client'

import { usePathname } from 'next/navigation'

interface NavLink { href: string; label: string; icon: string; onlyRol?: string }
interface Props { rol: string }

const LINKS: NavLink[] = [
  { href: '/dashboard',        label: 'Inicio',          icon: '◈' },
  { href: '/carruseles',       label: 'Carruseles',      icon: '▦' },
  { href: '/marcas',           label: 'Marcas',          icon: '◎' },
  { href: '/carruseles/nuevo', label: 'Nuevo carrusel',  icon: '+', onlyRol: 'editor' },
]

export default function NavLinks({ rol }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {LINKS.map((link) => {
        if (link.onlyRol && link.onlyRol !== rol) return null

        const isActive =
          link.href === '/carruseles/nuevo'
            ? pathname === link.href
            : pathname.startsWith(link.href)

        const isCta = link.href === '/carruseles/nuevo'

        let className = 'nav-link'
        if (isCta) className += isActive ? ' nav-link-cta-active' : ' nav-link-cta'
        else        className += isActive ? ' nav-link-active'     : ''

        return (
          <a key={link.href} href={link.href} className={className}>
            <span className="text-base leading-none w-4 text-center flex-shrink-0" style={{ opacity: 0.7 }}>{link.icon}</span>
            {link.label}
          </a>
        )
      })}
    </nav>
  )
}
