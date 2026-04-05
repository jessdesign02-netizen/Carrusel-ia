import { createClient } from '@/lib/supabase/server'
import type { Marca } from '@/types'

export default async function MarcasPage() {
  const supabase = await createClient()
  const { data: marcas, error } = await supabase
    .from('marcas')
    .select('*')
    .order('created_at', { ascending: false })

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
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">No hay marcas registradas todavía.</p>
          <a
            href="/marcas/nueva"
            className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline"
          >
            Crear la primera marca
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
