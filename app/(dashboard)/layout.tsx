import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavLinks from '@/components/ui/NavLinks'
import ToastProvider from '@/components/ui/ToastProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, rol, avatar_url')
    .eq('id', user.id)
    .single()

  const initials = ((profile?.nombre ?? user.email ?? '?')).slice(0, 2).toUpperCase()

  return (
    <ToastProvider>
      {/* Animated background orbs */}
      <div className="bg-orb animate-float"     style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(180,210,255,0.48) 0%, transparent 70%)', top: -100, left: -100 }} />
      <div className="bg-orb animate-float-rev" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(220,180,255,0.38) 0%, transparent 70%)', bottom: -80, right: -80 }} />
      <div className="bg-orb animate-pulse-glow" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(128,216,208,0.28) 0%, transparent 70%)', top: '40%', right: '25%' }} />

      <div className="min-h-screen flex relative z-10">
        {/* Sidebar */}
        <aside className="sidebar-glow flex flex-col flex-shrink-0 sticky top-0 h-screen" style={{ width: 220 }}>

          {/* Logo */}
          <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
            <div className="flex items-center gap-2.5">
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(122,184,245,0.55) 0%, rgba(192,168,240,0.50) 100%)',
                border: '1px solid rgba(255,255,255,0.70)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', color: 'var(--accent-blue)',
              }}>✦</div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Carrusel IA
              </span>
            </div>
          </div>

          {/* Nav */}
          <NavLinks rol={profile?.rol ?? 'editor'} />

          {/* User footer */}
          <a
            href="/sesion"
            className="px-4 py-4 flex items-center gap-2.5 transition-all"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.55)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(122,184,245,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.75)',
              boxShadow: '0 2px 8px rgba(120,160,220,0.14)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(122,184,245,0.40) 0%, rgba(192,168,240,0.40) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)' }}>{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }} className="truncate">
                {profile?.nombre ?? user.email}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {profile?.rol ?? 'editor'}
              </p>
            </div>

            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  )
}
