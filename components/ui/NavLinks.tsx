'use client'

import { usePathname } from 'next/navigation'

interface NavLink {
  href:     string
  label:    string
  onlyRol?: string
}

interface Props {
  rol: string
}

const LINKS: NavLink[] = [
  { href: '/dashboard',        label: 'Dashboard' },
  { href: '/carruseles',       label: 'Carruseles' },
  { href: '/marcas',           label: 'Marcas' },
  { href: '/carruseles/nuevo', label: '+ Nuevo carrusel', onlyRol: 'editor' },
]

export default function NavLinks({ rol }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-4 space-y-1">
      {LINKS.map((link) => {
        if (link.onlyRol && link.onlyRol !== rol) return null

        // /carruseles/nuevo solo activo en esa ruta exacta
        // todos los demás usan startsWith
        const isActive =
          link.href === '/carruseles/nuevo'
            ? pathname === link.href
            : pathname.startsWith(link.href)

        const isNew = link.href === '/carruseles/nuevo'

        return (
          <a
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isNew
                ? isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-indigo-600 hover:bg-indigo-50'
                : isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </a>
        )
      })}
    </nav>
  )
}
