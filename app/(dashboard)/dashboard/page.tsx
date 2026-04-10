import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { EstadoCarrusel, RolUsuario } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard — Carrusel IA',
}

const estadoConfig: Record<EstadoCarrusel, { label: string; color: string; bg: string; desc: string }> = {
  en_revision: { label: 'En revisión',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',  desc: 'Esperando aprobación' },
  con_cambios: { label: 'Con cambios',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',        desc: 'Requieren ajustes' },
  borrador:    { label: 'Borradores',   color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200',      desc: 'En preparación' },
  aprobado:    { label: 'Aprobados',    color: 'text-green-700',  bg: 'bg-green-50 border-green-200',    desc: 'Listos para publicar' },
}

interface CarruselReciente {
  id:          string
  enfoque:     string
  estado:      EstadoCarrusel
  updated_at:  string
  marca:       { nombre: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre')
    .eq('id', user.id)
    .single()

  const rol = (profile?.rol ?? 'editor') as RolUsuario

  // Conteos por estado en paralelo
  const [
    { count: nEnRevision },
    { count: nConCambios },
    { count: nBorrador },
    { count: nAprobado },
    { data: recientes },
    { count: nMarcas },
  ] = await Promise.all([
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('estado', 'en_revision'),
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('estado', 'con_cambios'),
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('estado', 'borrador'),
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
    supabase
      .from('carruseles')
      .select('id, enfoque, estado, updated_at, marca:marcas(nombre)')
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase.from('marcas').select('*', { count: 'exact', head: true }),
  ])

  const nombre = profile?.nombre ?? user.email ?? 'usuario'

  // Verificar credenciales configuradas
  const missingAnthropicKey = !process.env.ANTHROPIC_API_KEY
  const missingFalKey       = !process.env.FAL_KEY

  const stats: Array<{ estado: EstadoCarrusel; count: number }> = [
    { estado: 'en_revision', count: nEnRevision ?? 0 },
    { estado: 'con_cambios', count: nConCambios ?? 0 },
    { estado: 'borrador',    count: nBorrador   ?? 0 },
    { estado: 'aprobado',    count: nAprobado   ?? 0 },
  ]

  const totalCarruseles = (nEnRevision ?? 0) + (nConCambios ?? 0) + (nBorrador ?? 0) + (nAprobado ?? 0)

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {nombre.split('@')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalCarruseles} carrusel{totalCarruseles !== 1 ? 'es' : ''} en total
          {nMarcas ? ` · ${nMarcas} marca${nMarcas !== 1 ? 's' : ''}` : ''}
        </p>
      </div>

      {/* Aviso de credenciales faltantes */}
      {(missingAnthropicKey || missingFalKey) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-900">Configuración pendiente</p>
          {missingAnthropicKey && (
            <p className="text-xs text-amber-700">
              <span className="font-mono bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</span> no configurada →
              la generación con IA no funcionará. Agrégala en <span className="font-mono">.env.local</span>.
            </p>
          )}
          {missingFalKey && (
            <p className="text-xs text-amber-700">
              <span className="font-mono bg-amber-100 px-1 rounded">FAL_KEY</span> no configurada →
              la generación de imágenes con Flux está desactivada (opcional).
            </p>
          )}
        </div>
      )}

      {/* Cards de estado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ estado, count }) => {
          const cfg = estadoConfig[estado]
          return (
            <a
              key={estado}
              href={`/carruseles?estado=${estado}`}
              className={`rounded-xl border p-4 hover:shadow-md transition-shadow ${cfg.bg}`}
            >
              <p className={`text-3xl font-bold ${cfg.color}`}>{count}</p>
              <p className={`text-sm font-semibold mt-1 ${cfg.color}`}>{cfg.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cfg.desc}</p>
            </a>
          )
        })}
      </div>

      {/* Acción prioritaria según rol */}
      {rol === 'revisor' && (nEnRevision ?? 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-yellow-900">
              {nEnRevision} carrusel{(nEnRevision ?? 0) !== 1 ? 'es' : ''} esperan tu revisión
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">Aprueba o solicita cambios para desbloquear la descarga.</p>
          </div>
          <a
            href="/carruseles?estado=en_revision"
            className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Revisar ahora
          </a>
        </div>
      )}

      {rol === 'editor' && (nConCambios ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-900">
              {nConCambios} carrusel{(nConCambios ?? 0) !== 1 ? 'es' : ''} con cambios solicitados
            </p>
            <p className="text-xs text-red-700 mt-0.5">El revisor dejó feedback. Edita y regenera.</p>
          </div>
          <a
            href="/carruseles?estado=con_cambios"
            className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Ver cambios
          </a>
        </div>
      )}

      {/* Carruseles recientes */}
      {recientes && recientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Actividad reciente</h2>
            <a href="/carruseles" className="text-xs text-indigo-600 hover:underline">Ver todos →</a>
          </div>
          <div className="space-y-2">
            {(recientes as unknown as CarruselReciente[]).map((c) => {
              const cfg = estadoConfig[c.estado]
              return (
                <a
                  key={c.id}
                  href={`/carruseles/${c.id}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {c.marca?.nombre ?? 'Sin marca'}
                    </span>
                    <span className="text-gray-400 text-xs ml-2 capitalize">{c.enfoque}</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.updated_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state — sin datos */}
      {totalCarruseles === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <svg className="mx-auto mb-4 w-16 h-16 text-indigo-100" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 64 64">
            <rect x="8" y="14" width="48" height="36" rx="5" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M8 24h48" strokeWidth="2"/>
            <rect x="16" y="32" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M36 32h12M36 37h10M36 42h7" strokeLinecap="round" strokeWidth="2"/>
            <circle cx="16" cy="19" r="1.5" fill="currentColor"/>
            <circle cx="22" cy="19" r="1.5" fill="currentColor"/>
            <circle cx="28" cy="19" r="1.5" fill="currentColor"/>
          </svg>
          <p className="text-gray-700 font-semibold text-base">Todo listo para comenzar</p>
          <p className="text-gray-400 text-sm mt-1.5 mb-5 max-w-xs mx-auto">
            Crea tu primera marca y genera carruseles con IA en segundos.
          </p>
          {rol === 'editor' && (
            <div className="flex items-center justify-center gap-3">
              <a
                href="/marcas/nueva"
                className="text-sm text-gray-600 border border-gray-300 hover:border-indigo-400 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors"
              >
                + Crear marca
              </a>
              <a
                href="/carruseles/nuevo"
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Nuevo carrusel →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
