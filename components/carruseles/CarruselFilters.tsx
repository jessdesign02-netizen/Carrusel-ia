'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { EstadoCarrusel } from '@/types'

interface Marca { id: string; nombre: string }
interface Props { marcas: Marca[]; total: number; initialQ?: string; sort?: string }

const ESTADOS: { value: EstadoCarrusel | 'todos'; label: string }[] = [
  { value: 'todos',       label: 'Todos' },
  { value: 'borrador',    label: 'Borrador' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'con_cambios', label: 'Con cambios' },
  { value: 'aprobado',    label: 'Aprobado' },
]

const selectStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  padding: '0.4rem 0.75rem',
  background: 'rgba(255,255,255,0.50)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(180,210,240,0.42)',
  borderRadius: '12px',
  color: 'var(--text-secondary)',
  outline: 'none',
  cursor: 'pointer',
}

export default function CarruselFilters({ marcas, total, initialQ = '', sort = 'reciente' }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const estadoActual = params.get('estado') ?? 'todos'
  const marcaActual  = params.get('marcaId') ?? ''
  const [searchValue, setSearchValue] = useState(initialQ)

  useEffect(() => { setSearchValue(params.get('q') ?? '') }, [params])

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === '' || value === 'todos') next.delete(key)
    else next.set(key, value)
    next.delete('page')
    router.push(`${pathname}?${next.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams(params.toString())
    const q = searchValue.trim()
    if (q) next.set('q', q); else next.delete('q')
    next.delete('page')
    router.push(`${pathname}?${next.toString()}`)
  }

  function clearSearch() {
    setSearchValue('')
    const next = new URLSearchParams(params.toString())
    next.delete('q'); next.delete('page')
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Buscar por marca o enfoque…"
          className="input-glow"
          style={{ paddingLeft: '2.25rem', paddingRight: searchValue ? '2rem' : undefined }}
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {searchValue && (
          <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>✕</button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {/* Estado chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => update('estado', e.value)}
              className={estadoActual === e.value ? 'chip-glow chip-glow-active' : 'chip-glow'}
            >
              {e.label}
            </button>
          ))}
        </div>

        {marcas.length > 1 && (
          <select value={marcaActual} onChange={(e) => update('marcaId', e.target.value)} style={selectStyle}>
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        )}

        <select value={sort} onChange={(e) => update('sort', e.target.value === 'reciente' ? '' : e.target.value)} style={selectStyle}>
          <option value="reciente">Más reciente</option>
          <option value="antiguo">Más antiguo</option>
          <option value="marca">Marca A-Z</option>
        </select>

        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{total} resultado{total !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
