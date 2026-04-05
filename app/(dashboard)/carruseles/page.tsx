import { createClient } from '@/lib/supabase/server'
import type { Carrusel, EstadoCarrusel } from '@/types'

const estadoLabel: Record<EstadoCarrusel, { label: string; color: string }> = {
  borrador:     { label: 'Borrador',     color: 'bg-gray-100 text-gray-600' },
  en_revision:  { label: 'En revisión',  color: 'bg-yellow-100 text-yellow-700' },
  aprobado:     { label: 'Aprobado',     color: 'bg-green-100 text-green-700' },
  con_cambios:  { label: 'Con cambios',  color: 'bg-red-100 text-red-700' },
}

export default async function CarruselesPage() {
  const supabase = await createClient()
  const { data: carruseles, error } = await supabase
    .from('carruseles')
    .select('*, marca:marcas(nombre)')
    .order('updated_at', { ascending: false })

  return (
    <div>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          Error al cargar carruseles.
        </div>
      )}

      {!error && (!carruseles || carruseles.length === 0) && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">No hay carruseles todavía.</p>
          <a
            href="/carruseles/nuevo"
            className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline"
          >
            Crear el primer carrusel
          </a>
        </div>
      )}

      {carruseles && carruseles.length > 0 && (
        <div className="space-y-3">
          {carruseles.map((c: Carrusel & { marca: { nombre: string } | null }) => {
            const estado = estadoLabel[c.estado]
            return (
              <a
                key={c.id}
                href={`/carruseles/${c.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-md transition-shadow"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {c.marca?.nombre ?? 'Sin marca'}
                    </span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-500 text-xs capitalize">{c.enfoque}</span>
                    <span className="text-gray-400 text-xs">· v{c.version}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(c.updated_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {c.publicado_at && (
                      <span className="ml-2 text-green-600 font-medium">· Publicado</span>
                    )}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estado.color}`}>
                  {estado.label}
                </span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
