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
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-base font-bold text-gray-900">Carrusel IA</h1>
        </div>

        <NavLinks rol={profile?.rol ?? 'editor'} />

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {profile?.nombre ?? user.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{profile?.rol}</p>
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
