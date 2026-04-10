import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import SesionClient from '@/components/sesion/SesionClient'

export const metadata: Metadata = { title: 'Mi sesión — Carrusel IA' }

export default async function SesionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, rol, avatar_url, bio, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl" style={{ fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Mi sesión
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Gestiona tu perfil y preferencias de cuenta
        </p>
      </div>

      <SesionClient
        userId={user.id}
        email={user.email ?? ''}
        nombre={profile?.nombre ?? ''}
        rol={profile?.rol ?? 'editor'}
        avatarUrl={profile?.avatar_url ?? null}
        bio={profile?.bio ?? ''}
        createdAt={profile?.created_at ?? null}
      />
    </div>
  )
}
