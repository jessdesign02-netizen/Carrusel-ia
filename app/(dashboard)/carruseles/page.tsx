import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import CarruselFilters from '@/components/carruseles/CarruselFilters'
import type { EstadoCarrusel } from '@/types'

export const metadata: Metadata = { title: 'Carruseles — Carrusel IA' }

const estadoLabel: Record<EstadoCarrusel, { label: string; style: React.CSSProperties }> = {
  borrador:    { label: 'Borrador',    style: { background: 'rgba(255,255,255,0.30)', color: '#A0B0C8', border: '1px solid rgba(255,255,255,0.50)' } },
  en_revision: { label: 'En revisión', style: { background: 'rgba(240,160,192,0.18)', color: '#C07898', border: '1px solid rgba(240,160,192,0.38)' } },
  aprobado:    { label: 'Aprobado',    style: { background: 'rgba(96,200,160,0.18)',  color: '#3A9870', border: '1px solid rgba(96,200,160,0.38)'  } },
  con_cambios: { label: 'Con cambios', style: { background: 'rgba(122,184,245,0.18)', color: '#4A88C8', border: '1px solid rgba(122,184,245,0.38)' } },
}

interface SlideResumen { numero: number; url_jpg: string | null }
interface CarruselRow {
  id: string; enfoque: string; estado: EstadoCarrusel; version: number
  updated_at: string; publicado_at: string | null
  marca: { id: string; nombre: string } | null
  slides: SlideResumen[]
}

const PAGE_SIZE = 20
type SortOption = 'reciente' | 'antiguo' | 'marca'
interface Props { searchParams: Promise<{ estado?: string; marcaId?: string; page?: string; q?: string; sort?: string }> }

export default async function CarruselesPage({ searchParams }: Props) {
  const { estado, marcaId, page: pageParam, q, sort: sortParam } = await searchParams
  const sort  = (sortParam ?? 'reciente') as SortOption
  const page  = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from  = (page - 1) * PAGE_SIZE
  const to    = from + PAGE_SIZE - 1
  const query = q?.trim() ?? ''

  const supabase = await createClient()

  let searchMarcaIds: string[] = []
  if (query) {
    const { data: matchingMarcas } = await supabase.from('marcas').select('id').ilike('nombre', `%${query}%`)
    searchMarcaIds = (matchingMarcas ?? []).map((m: { id: string }) => m.id)
  }

  const orderBy =
    sort === 'antiguo' ? { column: 'updated_at', ascending: true } :
    sort === 'marca'   ? { column: 'marca_id',   ascending: true } :
                         { column: 'updated_at', ascending: false }

  let baseQuery  = supabase.from('carruseles').select('id, enfoque, estado, version, updated_at, publicado_at, marca:marcas(id, nombre), slides(numero, url_jpg)').order(orderBy.column, { ascending: orderBy.ascending })
  let countQuery = supabase.from('carruseles').select('*', { count: 'exact', head: true })

  if (estado && estado !== 'todos') { baseQuery = baseQuery.eq('estado', estado); countQuery = countQuery.eq('estado', estado) }
  if (marcaId)                      { baseQuery = baseQuery.eq('marca_id', marcaId); countQuery = countQuery.eq('marca_id', marcaId) }
  if (query) {
    const orFilter = searchMarcaIds.length > 0 ? `enfoque.ilike.%${query}%,marca_id.in.(${searchMarcaIds.join(',')})` : `enfoque.ilike.%${query}%`
    baseQuery = baseQuery.or(orFilter); countQuery = countQuery.or(orFilter)
  }

  const [{ data: carruseles, error }, { count: totalCount }, { data: marcas }] = await Promise.all([
    baseQuery.range(from, to),
    countQuery,
    supabase.from('marcas').select('id, nombre').order('nombre'),
  ])

  const rows       = (carruseles ?? []) as unknown as CarruselRow[]
  const total      = totalCount ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Carruseles</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Todos los carruseles generados</p>
        </div>
        <a href="/carruseles/nuevo" className="btn-primary">+ Nuevo carrusel</a>
      </div>

      {/* Filtros */}
      <div className="mb-5">
        <Suspense fallback={null}>
          <CarruselFilters marcas={(marcas ?? []) as { id: string; nombre: string }[]} total={total} initialQ={query} sort={sort} />
        </Suspense>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-2xl mb-4 text-sm" style={{ background: 'rgba(240,128,128,0.12)', color: 'var(--accent-negative)', border: '1px solid rgba(240,128,128,0.25)' }}>
          Error al cargar carruseles.
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="card-glow text-center py-20 px-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 animate-float-slow flex items-center justify-center" style={{
            background: 'rgba(122,184,245,0.18)',
            border: '1px solid rgba(122,184,245,0.35)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
          }}>
            <span style={{ fontSize: '1.75rem', opacity: 0.7 }}>▦</span>
          </div>
          {estado && estado !== 'todos' ? (
            <>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Sin resultados</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>No hay carruseles que coincidan con los filtros.</p>
              <a href="/carruseles" className="btn-secondary">← Quitar filtros</a>
            </>
          ) : (
            <>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Todavía no hay carruseles</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Genera tu primer carrusel con IA en segundos.</p>
              <a href="/carruseles/nuevo" className="btn-primary">+ Crear primer carrusel</a>
            </>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-2 mb-6">
          {rows.map((c) => {
            const est    = estadoLabel[c.estado]
            const thumb  = c.slides.sort((a, b) => a.numero - b.numero).find((s) => s.url_jpg)?.url_jpg ?? null
            const nSlides = c.slides.length
            const nJpg    = c.slides.filter((s) => s.url_jpg).length

            return (
              <a key={c.id} href={`/carruseles/${c.id}`} className="card-glow card-glow-hover flex items-center gap-4 px-4 py-3 block" style={{ textDecoration: 'none' }}>
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden" style={{
                  background: 'rgba(122,184,245,0.14)',
                  border: '1px solid rgba(255,255,255,0.55)',
                }}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {nSlides}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.marca?.nombre ?? 'Sin marca'}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                    <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{c.enfoque}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· v{c.version}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{new Date(c.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span>{nJpg > 0 ? `${nJpg}/${nSlides} JPGs` : `${nSlides} slide${nSlides !== 1 ? 's' : ''}`}</span>
                    {c.publicado_at && <span style={{ color: 'var(--accent-positive)', fontWeight: 500 }}>Publicado</span>}
                  </div>
                </div>

                {/* Estado */}
                <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full" style={est.style}>{est.label}</span>
              </a>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} estado={estado} marcaId={marcaId} q={query || undefined} sort={sort !== 'reciente' ? sort : undefined} />
      )}
    </div>
  )
}

// ── Paginación ────────────────────────────────────────────────────────────────

interface PaginationProps { page: number; totalPages: number; estado?: string; marcaId?: string; q?: string; sort?: string }

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

const pageBtn: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 400,
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.30)',
  border: '1px solid rgba(255,255,255,0.50)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  backdropFilter: 'blur(8px)',
}
const pageBtnActive: React.CSSProperties = {
  ...pageBtn,
  background: 'rgba(122,184,245,0.22)',
  border: '1px solid rgba(122,184,245,0.45)',
  color: 'var(--accent-blue)',
  fontWeight: 500,
}
const pageBtnDisabled: React.CSSProperties = {
  ...pageBtn,
  opacity: 0.35,
  pointerEvents: 'none',
  cursor: 'default',
}

function Pagination({ page, totalPages, estado, marcaId, q, sort }: PaginationProps) {
  const prevUrl = page > 1         ? buildUrl(page - 1, estado, marcaId, q, sort) : null
  const nextUrl = page < totalPages ? buildUrl(page + 1, estado, marcaId, q, sort) : null
  const start   = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end     = Math.min(totalPages, start + 4)
  const pages   = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className="flex items-center justify-center gap-1 mt-4" aria-label="Paginación">
      <a href={prevUrl ?? '#'} style={prevUrl ? pageBtn : pageBtnDisabled}>← Anterior</a>

      {start > 1 && (
        <>
          <a href={buildUrl(1, estado, marcaId, q, sort)} style={pageBtn}>1</a>
          {start > 2 && <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <a key={p} href={buildUrl(p, estado, marcaId, q, sort)} style={p === page ? pageBtnActive : pageBtn}>{p}</a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>}
          <a href={buildUrl(totalPages, estado, marcaId, q, sort)} style={pageBtn}>{totalPages}</a>
        </>
      )}

      <a href={nextUrl ?? '#'} style={nextUrl ? pageBtn : pageBtnDisabled}>Siguiente →</a>
    </nav>
  )
}
