import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Marca } from '@/types'

export const metadata: Metadata = {
  title: 'Marcas — Carrusel IA',
}

const MARCAS_DEMO: Marca[] = [
  {
    id: 'demo-juan',
    nombre: 'Juan',
    colores: { primario: '#6366f1', secundario: '#a5b4fc', acento: '#4f46e5', neutro: '#f1f5f9' },
    tipografias: [{ nombre: 'Inter', peso: '700', uso: 'títulos' }],
    tono_visual: 'Moderno y profesional con toques creativos.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-marco',
    nombre: 'Marco',
    colores: { primario: '#10b981', secundario: '#6ee7b7', acento: '#059669', neutro: '#f0fdf4' },
    tipografias: [{ nombre: 'Inter', peso: '700', uso: 'títulos' }],
    tono_visual: 'Fresco, natural y cercano.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-saleads',
    nombre: 'Saleads',
    colores: { primario: '#f59e0b', secundario: '#fcd34d', acento: '#d97706', neutro: '#fffbeb' },
    tipografias: [{ nombre: 'Inter', peso: '700', uso: 'títulos' }],
    tono_visual: 'Energético, directo y orientado a resultados.',
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
          <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las guías de marca y sus assets</p>
        </div>
        <a
          href="/marcas/nueva"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nueva marca
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          Error al cargar marcas. Verifica las credenciales de Supabase en .env.local
        </div>
      )}

      {!error && (!marcas || marcas.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <svg className="mx-auto mb-4 w-14 h-14 text-indigo-100" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 48 48">
            <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="24" cy="22" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M14 36c1.5-4 5.5-6 10-6s8.5 2 10 6" strokeLinecap="round" stroke="currentColor" strokeWidth="2"/>
            <path d="M18 8h12" strokeLinecap="round" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <p className="text-gray-600 font-medium">Todavía no hay marcas</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Crea la guía de marca y sube sus assets para empezar a generar carruseles.</p>
          <a
            href="/marcas/nueva"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Crear primera marca
          </a>
        </div>
      )}

      {marcas && marcas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marcas.map((marca: Marca) => (
            <a
              key={marca.id}
              href={`/marcas/${marca.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: marca.colores?.primario ?? '#6366f1' }}
                />
                <h2 className="font-semibold text-gray-900 truncate">{marca.nombre}</h2>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(marca.colores ?? {}).map(([key, hex]) => (
                  <div
                    key={key}
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: hex as string }}
                    title={`${key}: ${hex}`}
                  />
                ))}
              </div>

              {marca.tono_visual && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{marca.tono_visual}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
