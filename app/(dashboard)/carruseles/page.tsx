import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import CarruselFilters from '@/components/carruseles/CarruselFilters'
import type { EstadoCarrusel } from '@/types'

export const metadata: Metadata = {
  title: 'Carruseles — Carrusel IA',
}

const estadoLabel: Record<EstadoCarrusel, { label: string; color: string }> = {
  borrador:    { label: 'Borrador',    color: 'bg-gray-100 text-gray-600' },
  en_revision: { label: 'En revisión', color: 'bg-yellow-100 text-yellow-700' },
  aprobado:    { label: 'Aprobado',    color: 'bg-green-100 text-green-700' },
  con_cambios: { label: 'Con cambios', color: 'bg-red-100 text-red-700' },
}

interface SlideResumen {
  numero:  number
  url_jpg: string | null
}

interface CarruselRow {
  id:          string
  enfoque:     string
  estado:      EstadoCarrusel
  version:     number
  updated_at:  string
  publicado_at: string | null
  marca:       { id: string; nombre: string } | null
  slides:      SlideResumen[]
}

const PAGE_SIZE = 20

type SortOption = 'reciente' | 'antiguo' | 'marca'

interface Props {
  searchParams: Promise<{ estado?: string; marcaId?: string; page?: string; q?: string; sort?: string }>
}

export default async function CarruselesPage({ searchParams }: Props) {
  const { estado, marcaId, page: pageParam, q, sort: sortParam } = await searchParams
  const sort = (sortParam ?? 'reciente') as SortOption
  const page    = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from    = (page - 1) * PAGE_SIZE
  const to      = from + PAGE_SIZE - 1
  const query   = q?.trim() ?? ''

  const supabase = await createClient()

  // Resolve marca IDs that match the search term (for cross-table search)
  let searchMarcaIds: string[] = []
  if (query) {
    const { data: matchingMarcas } = await supabase
      .from('marcas')
      .select('id')
      .ilike('nombre', `%${query}%`)
    searchMarcaIds = (matchingMarcas ?? []).map((m: { id: string }) => m.id)
  }

  // Build order
  const orderBy: { column: string; ascending: boolean } =
    sort === 'antiguo' ? { column: 'updated_at', ascending: true }  :
    sort === 'marca'   ? { column: 'marca_id',   ascending: true }  :
                         { column: 'updated_at', ascending: false }

  let baseQuery = supabase
    .from('carruseles')
    .select('id, enfoque, estado, version, updated_at, publicado_at, marca:marcas(id, nombre), slides(numero, url_jpg)')
    .order(orderBy.column, { ascending: orderBy.ascending })

  let countQuery = supabase
    .from('carruseles')
    .select('*', { count: 'exact', head: true })

  if (estado && estado !== 'todos') {
    baseQuery  = baseQuery.eq('estado', estado)
    countQuery = countQuery.eq('estado', estado)
  }
  if (marcaId) {
    baseQuery  = baseQuery.eq('marca_id', marcaId)
    countQuery = countQuery.eq('marca_id', marcaId)
  }
  if (query) {
    const orFilter = searchMarcaIds.length > 0
      ? `enfoque.ilike.%${query}%,marca_id.in.(${searchMarcaIds.join(',')})`
      : `enfoque.ilike.%${query}%`
    baseQuery  = baseQuery.or(orFilter)
    countQuery = countQuery.or(orFilter)
  }

  const [{ data: carruseles, error }, { count: totalCount }, { data: marcas }] = await Promise.all([
    baseQuery.range(from, to),
    countQuery,
    supabase.from('marcas').select('id, nombre').order('nombre'),
  ])

  const rows      = (carruseles ?? []) as unknown as CarruselRow[]
  const total     = totalCount ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carruseles</h1>
          <p className="text-sm text-gray-500 mt-1">Todos los carruseles generados</p>
        </div>
        <a
          href="/carruseles/nuevo"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo carrusel
        </a>
      </div>

      {/* Filtros */}
      <div className="mb-5">
        <Suspense fallback={null}>
          <CarruselFilters
            marcas={(marcas ?? []) as { id: string; nombre: string }[]}
            total={total}
            initialQ={query}
            sort={sort}
          />
        </Suspense>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          Error al cargar carruseles.
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          {estado && estado !== 'todos' ? (
            <>
              <svg className="mx-auto mb-4 w-14 h-14 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 48 48">
                <path d="M10 38V16a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v22" strokeLinecap="round" strokeWidth="2"/>
                <path d="M6 38h36" strokeLinecap="round" strokeWidth="2"/>
                <path d="M20 28h8M20 22h8" strokeLinecap="round" strokeWidth="2"/>
              </svg>
              <p className="text-gray-600 font-medium">Sin resultados</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">No hay carruseles que coincidan con los filtros aplicados.</p>
              <a href="/carruseles" className="inline-block text-indigo-600 text-sm font-medium hover:underline">
                ← Quitar filtros
              </a>
            </>
          ) : (
            <>
              <svg className="mx-auto mb-4 w-14 h-14 text-indigo-100" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 48 48">
                <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M6 18h36" strokeWidth="2"/>
                <rect x="12" y="24" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M27 24h9M27 28h7M27 32h5" strokeLinecap="round" strokeWidth="2"/>
              </svg>
              <p className="text-gray-600 font-medium">Todavía no hay carruseles</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">Genera tu primer carrusel con IA en segundos.</p>
              <a href="/carruseles/nuevo" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                + Crear primer carrusel
              </a>
            </>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-2 mb-6">
          {rows.map((c) => {
            const est    = estadoLabel[c.estado]
            // Primer slide con JPG exportado (para thumbnail)
            const thumb  = c.slides
              .sort((a, b) => a.numero - b.numero)
              .find((s) => s.url_jpg)?.url_jpg ?? null
            const nSlides = c.slides.length
            const nJpg    = c.slides.filter((s) => s.url_jpg).length

            return (
              <a
                key={c.id}
                href={`/carruseles/${c.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">
                      {nSlides}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {c.marca?.nombre ?? 'Sin marca'}
                    </span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-500 text-xs capitalize">{c.enfoque}</span>
                    <span className="text-gray-400 text-xs">· v{c.version}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {new Date(c.updated_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <span>
                      {nJpg > 0
                        ? `${nJpg}/${nSlides} JPGs`
                        : `${nSlides} slide${nSlides !== 1 ? 's' : ''}`}
                    </span>
                    {c.publicado_at && (
                      <span className="text-green-600 font-medium">Publicado</span>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${est.color}`}>
                  {est.label}
                </span>
              </a>
            )
          })}
        </div>
      )}
      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          estado={estado}
          marcaId={marcaId}
          q={query || undefined}
          sort={sort !== 'reciente' ? sort : undefined}
        />
      )}
    </div>
  )
}

// ── Paginación ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page:       number
  totalPages: number
  estado?:    string
  marcaId?:   string
  q?:         string
  sort?:      string
}

function buildUrl(page: number, estado?: string, marcaId?: string, q?: string, sort?: string) {
  const p = new URLSearchParams()
  if (estado && estado !== 'todos') p.set('estado', estado)
  if (marcaId) p.set('marcaId', marcaId)
  if (q) p.set('q', q)
  if (sort) p.set('sort', sort)
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  return `/carruseles${qs ? `?${qs}` : ''}`
}

function Pagination({ page, totalPages, estado, marcaId, q, sort }: PaginationProps) {
  const prevUrl = page > 1         ? buildUrl(page - 1, estado, marcaId, q, sort) : null
  const nextUrl = page < totalPages ? buildUrl(page + 1, estado, marcaId, q, sort) : null

  // Ventana de páginas: máximo 5 botones centrados en la actual
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end   = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className="flex items-center justify-center gap-1 mt-4" aria-label="Paginación">
      <a
        href={prevUrl ?? '#'}
        aria-disabled={!prevUrl}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          prevUrl
            ? 'border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 bg-white'
            : 'border-gray-200 text-gray-300 cursor-default pointer-events-none bg-white'
        }`}
      >
        ← Anterior
      </a>

      {start > 1 && (
        <>
          <a href={buildUrl(1, estado, marcaId, q, sort)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 bg-white transition-colors">1</a>
          {start > 2 && <span className="px-1 text-xs text-gray-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <a
          key={p}
          href={buildUrl(p, estado, marcaId, q, sort)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            p === page
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 bg-white'
          }`}
        >
          {p}
        </a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-xs text-gray-400">…</span>}
          <a href={buildUrl(totalPages, estado, marcaId, q, sort)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 bg-white transition-colors">{totalPages}</a>
        </>
      )}

      <a
        href={nextUrl ?? '#'}
        aria-disabled={!nextUrl}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          nextUrl
            ? 'border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 bg-white'
            : 'border-gray-200 text-gray-300 cursor-default pointer-events-none bg-white'
        }`}
      >
        Siguiente →
      </a>
    </nav>
  )
}
