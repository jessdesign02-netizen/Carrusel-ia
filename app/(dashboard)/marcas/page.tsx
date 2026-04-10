import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Marca } from '@/types'

export const metadata: Metadata = {
  title: 'Marcas — Carrusel IA',
}

const MARCAS_DEMO: Marca[] = [
  {
    id: 'demo-juan', nombre: 'Juan',
    colores: { primario: '#6366f1', secundario: '#a5b4fc', acento: '#4f46e5', neutro: '#f1f5f9' },
    tipografias: [{ nombre: 'Inter', peso: '700', uso: 'títulos' }],
    tono_visual: 'Moderno y profesional con toques creativos.',
    sector: null, descripcion: null, publico_objetivo: null, personalidad: null,
    estilo_visual: null, tono_comunicacion: null, palabras_clave: null,
    palabras_evitar: null, referencias: null, manual_marca_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-marco', nombre: 'Marco',
    colores: { primario: '#10b981', secundario: '#6ee7b7', acento: '#059669', neutro: '#f0fdf4' },
    tipografias: [{ nombre: 'Inter', peso: '700', uso: 'títulos' }],
    tono_visual: 'Fresco, natural y cercano.',
    sector: null, descripcion: null, publico_objetivo: null, personalidad: null,
    estilo_visual: null, tono_comunicacion: null, palabras_clave: null,
    palabras_evitar: null, referencias: null, manual_marca_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-saleads', nombre: 'Saleads',
    colores: { primario: '#f59e0b', secundario: '#fcd34d', acento: '#d97706', neutro: '#fffbeb' },
    tipografias: [{ nombre: 'Inter', peso: '700', uso: 'títulos' }],
    tono_visual: 'Energético, directo y orientado a resultados.',
    sector: null, descripcion: null, publico_objetivo: null, personalidad: null,
    estilo_visual: null, tono_comunicacion: null, palabras_clave: null,
    palabras_evitar: null, referencias: null, manual_marca_url: null,
    created_at: new Date().toISOString(),
  },
]

export default async function MarcasPage() {
  const supabase = await createClient()
  const { data: marcasDB, error } = await supabase
    .from('marcas')
    .select('*')
    .order('created_at', { ascending: false })

  const marcas = [...MARCAS_DEMO, ...(marcasDB ?? [])]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Marcas</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Gestiona las guías de marca y sus assets</p>
        </div>
        <a href="/marcas/nueva" className="btn-primary">+ Nueva marca</a>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-2xl mb-4 text-sm" style={{ background: 'rgba(240,128,128,0.12)', color: 'var(--accent-negative)', border: '1px solid rgba(240,128,128,0.25)' }}>
          Error al cargar marcas. Verifica las credenciales de Supabase en .env.local
        </div>
      )}

      {!error && (!marcas || marcas.length === 0) && (
        <div className="card-glow text-center py-20 px-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 animate-float-slow flex items-center justify-center" style={{
            background: 'rgba(192,168,240,0.22)',
            border: '1px solid rgba(192,168,240,0.38)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
          }}>
            <span style={{ fontSize: '1.75rem', opacity: 0.7 }}>◎</span>
          </div>
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Todavía no hay marcas</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Crea la guía de marca y sube sus assets para empezar a generar carruseles.</p>
          <a href="/marcas/nueva" className="btn-primary">+ Crear primera marca</a>
        </div>
      )}

      {marcas && marcas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marcas.map((marca: Marca) => (
            <a
              key={marca.id}
              href={`/marcas/${marca.id}`}
              className="card-glow card-glow-hover p-5 block"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-2xl flex-shrink-0"
                  style={{
                    backgroundColor: marca.colores?.primario ?? '#6366f1',
                    boxShadow: `0 2px 10px ${marca.colores?.primario ?? '#6366f1'}55, inset 0 1px 1px rgba(255,255,255,0.40)`,
                  }}
                />
                <h2 className="font-medium truncate" style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                  {marca.nombre}
                </h2>
              </div>

              <div className="flex gap-1.5 flex-wrap mb-2">
                {Object.entries(marca.colores ?? {}).map(([key, hex]) => (
                  <div
                    key={key}
                    className="w-5 h-5 rounded-full"
                    style={{
                      backgroundColor: hex as string,
                      boxShadow: `0 1px 4px ${hex as string}66`,
                      border: '1.5px solid rgba(255,255,255,0.60)',
                    }}
                    title={`${key}: ${hex}`}
                  />
                ))}
              </div>

              {(marca.tono_visual || marca.sector) && (
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {marca.sector ? `${marca.sector} · ` : ''}{marca.tono_visual}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
