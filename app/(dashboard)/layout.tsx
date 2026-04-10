import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'
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
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

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
          <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
            <div className="flex items-center gap-2.5">
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(122,184,245,0.60) 0%, rgba(192,168,240,0.55) 100%)',
                border: '1px solid rgba(255,255,255,0.70)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem',
              }}>✦</div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Carrusel IA
              </span>
            </div>
          </div>

          {/* Nav */}
          <NavLinks rol={profile?.rol ?? 'editor'} />

          {/* User footer */}
          <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}>
            {/* Avatar row */}
            <div className="flex items-center gap-2.5 mb-3">
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(122,184,245,0.50) 0%, rgba(192,168,240,0.50) 100%)',
                border: '2px solid rgba(255,255,255,0.80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)',
              }}>
                {(profile?.nombre ?? user.email ?? '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }} className="truncate">
                  {profile?.nombre ?? user.email}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profile?.rol ?? 'editor'}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  )
}
