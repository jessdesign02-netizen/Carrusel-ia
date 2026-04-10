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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="sidebar-glow w-56 flex flex-col flex-shrink-0 sticky top-0 h-screen">
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.40)' }}>
          <h1 className="text-sm font-medium" style={{ color: 'rgba(90,55,120,0.90)' }}>✦ Carrusel IA</h1>
        </div>

        <NavLinks rol={profile?.rol ?? 'editor'} />

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.40)' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.nombre ?? user.email}
              </p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{profile?.rol}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
    </ToastProvider>
  )
}
