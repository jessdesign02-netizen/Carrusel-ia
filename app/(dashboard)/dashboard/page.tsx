import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { EstadoCarrusel, RolUsuario } from '@/types'

export const metadata: Metadata = { title: 'Dashboard — Carrusel IA' }

const estadoConfig: Record<EstadoCarrusel, { label: string; desc: string; color: string; bg: string; border: string }> = {
  en_revision: { label: 'En revisión',  desc: 'Esperando aprobación', color: 'var(--accent-blue)',     bg: 'rgba(122,184,245,0.14)',  border: 'rgba(122,184,245,0.30)'  },
  con_cambios: { label: 'Con cambios',  desc: 'Requieren ajustes',    color: 'var(--accent-negative)', bg: 'rgba(240,128,128,0.12)',  border: 'rgba(240,128,128,0.28)'  },
  borrador:    { label: 'Borradores',   desc: 'En preparación',       color: 'var(--text-secondary)',  bg: 'rgba(255,255,255,0.30)',  border: 'rgba(255,255,255,0.50)'  },
  aprobado:    { label: 'Aprobados',    desc: 'Listos para publicar', color: 'var(--accent-positive)', bg: 'rgba(96,200,160,0.14)',   border: 'rgba(96,200,160,0.30)'   },
}

interface CarruselReciente {
  id:         string
  enfoque:    string
  estado:     EstadoCarrusel
  updated_at: string
  marca:      { nombre: string } | null
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
    supabase.from('carruseles').select('id, enfoque, estado, updated_at, marca:marcas(nombre)').order('updated_at', { ascending: false }).limit(6),
    supabase.from('marcas').select('*', { count: 'exact', head: true }),
  ])

  const nombre = profile?.nombre ?? user.email ?? 'usuario'
  const missingAnthropicKey = !process.env.ANTHROPIC_API_KEY

  const stats: Array<{ estado: EstadoCarrusel; count: number }> = [
    { estado: 'en_revision', count: nEnRevision ?? 0 },
    { estado: 'con_cambios', count: nConCambios ?? 0 },
    { estado: 'borrador',    count: nBorrador   ?? 0 },
    { estado: 'aprobado',    count: nAprobado   ?? 0 },
  ]

  const totalCarruseles = stats.reduce((s, x) => s + x.count, 0)

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Bienvenida */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Hola, {nombre.split('@')[0]} ✦
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {totalCarruseles} carrusel{totalCarruseles !== 1 ? 'es' : ''}
          {nMarcas ? ` · ${nMarcas} marca${nMarcas !== 1 ? 's' : ''}` : ''}
        </p>
      </div>

      {/* Aviso de configuración */}
      {missingAnthropicKey && (
        <div className="glass-l2 px-4 py-3" style={{ borderLeft: '3px solid rgba(240,160,192,0.60)' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>Configuración pendiente</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <code style={{ background: 'rgba(255,255,255,0.40)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>ANTHROPIC_API_KEY</code>
            {' '}no configurada — la generación con IA no funcionará. Agrégala en{' '}
            <code style={{ background: 'rgba(255,255,255,0.40)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>.env.local</code>.
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ estado, count }) => {
          const cfg = estadoConfig[estado]
          return (
            <a
              key={estado}
              href={`/carruseles?estado=${estado}`}
              className="glass-l2 card-glow-hover p-5 block"
              style={{ textDecoration: 'none', borderLeft: `3px solid ${cfg.border}` }}
            >
              <p style={{ fontSize: 30, fontWeight: 600, color: cfg.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {count}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginTop: 6 }}>{cfg.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{cfg.desc}</p>
            </a>
          )
        })}
      </div>

      {/* Acción prioritaria */}
      {rol === 'revisor' && (nEnRevision ?? 0) > 0 && (
        <div className="glass-l2 px-5 py-4 flex items-center justify-between gap-4" style={{ borderLeft: '3px solid rgba(122,184,245,0.55)' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {nEnRevision} carrusel{(nEnRevision ?? 0) !== 1 ? 'es' : ''} esperan tu revisión
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Aprueba o solicita cambios para desbloquear la descarga.</p>
          </div>
          <a href="/carruseles?estado=en_revision" className="btn-primary flex-shrink-0">Revisar ahora →</a>
        </div>
      )}

      {rol === 'editor' && (nConCambios ?? 0) > 0 && (
        <div className="glass-l2 px-5 py-4 flex items-center justify-between gap-4" style={{ borderLeft: '3px solid rgba(240,128,128,0.55)' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {nConCambios} carrusel{(nConCambios ?? 0) !== 1 ? 'es' : ''} con cambios solicitados
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>El revisor dejó feedback. Edita y regenera.</p>
          </div>
          <a href="/carruseles?estado=con_cambios" className="btn-primary flex-shrink-0">Ver cambios →</a>
        </div>
      )}

      {/* Actividad reciente */}
      {recientes && recientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Actividad reciente
            </p>
            <a href="/carruseles" style={{ fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
              Ver todos →
            </a>
          </div>
          <div className="space-y-1.5">
            {(recientes as unknown as CarruselReciente[]).map((c) => {
              const cfg = estadoConfig[c.estado]
              return (
                <a
                  key={c.id}
                  href={`/carruseles/${c.id}`}
                  className="glass-l2 card-glow-hover flex items-center justify-between px-4 py-3 block"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="min-w-0">
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">
                      {c.marca?.nombre ?? 'Sin marca'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }} className="capitalize">{c.enfoque}</span>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(c.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 500,
                    padding: '3px 10px', borderRadius: 999,
                    background: cfg.bg, color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                  }}>{cfg.label}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCarruseles === 0 && (
        <div className="glass-l1 text-center py-20 px-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center animate-float-slow" style={{
            background: 'rgba(122,184,245,0.16)',
            border: '1px solid rgba(122,184,245,0.30)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
          }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--accent-blue)', opacity: 0.7 }}>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M3 9h18" strokeWidth="1.5"/>
              <rect x="6" y="12" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Todo listo para comenzar</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 260, margin: '0 auto 24px' }}>
            Crea tu primera marca y genera carruseles con IA en segundos.
          </p>
          {rol === 'editor' && (
            <div className="flex items-center justify-center gap-3">
              <a href="/marcas/nueva" className="btn-secondary">+ Crear marca</a>
              <a href="/carruseles/nuevo" className="btn-primary">+ Nuevo carrusel →</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
