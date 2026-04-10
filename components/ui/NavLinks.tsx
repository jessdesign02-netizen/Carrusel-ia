'use client'

import { usePathname } from 'next/navigation'

interface NavLink { href: string; label: string; icon: string; onlyRol?: string }
interface Props { rol: string }

const LINKS: NavLink[] = [
  { href: '/dashboard',        label: 'Inicio',         icon: '⊞' },
  { href: '/carruseles',       label: 'Carruseles',     icon: '▦' },
  { href: '/marcas',           label: 'Marcas',         icon: '◎' },
  { href: '/carruseles/nuevo', label: 'Nuevo carrusel', icon: '+', onlyRol: 'editor' },
]

const BOTTOM_LINKS: NavLink[] = [
  { href: '/sesion', label: 'Mi sesión', icon: '○' },
]

export default function NavLinks({ rol }: Props) {
  const pathname = usePathname()

  function linkClass(link: NavLink) {
    const isActive =
      link.href === '/carruseles/nuevo'
        ? pathname === link.href
        : pathname.startsWith(link.href)
    const isCta = link.href === '/carruseles/nuevo'
    let cls = 'nav-link'
    if (isCta) cls += isActive ? ' nav-link-cta-active' : ' nav-link-cta'
    else        cls += isActive ? ' nav-link-active'     : ''
    return { cls, isActive }
  }

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col justify-between">
      <div className="space-y-0.5">
        {LINKS.map((link) => {
          if (link.onlyRol && link.onlyRol !== rol) return null
          const { cls, isActive } = linkClass(link)
          return (
            <a key={link.href} href={link.href} className={cls}>
              <span style={{ fontSize: 13, opacity: isActive ? 1 : 0.55, width: 16, textAlign: 'center', flexShrink: 0 }}>
                {link.icon}
              </span>
              {link.label}
            </a>
          )
        })}
      </div>

      <div className="space-y-0.5 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.40)', paddingTop: '0.75rem' }}>
        {BOTTOM_LINKS.map((link) => {
          const { cls, isActive } = linkClass(link)
          return (
            <a key={link.href} href={link.href} className={cls}>
              <span style={{ fontSize: 13, opacity: isActive ? 1 : 0.55, width: 16, textAlign: 'center', flexShrink: 0 }}>
                {link.icon}
              </span>
              {link.label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
