'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      title="Cerrar sesión"
      style={{
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.40)',
        border: '1px solid rgba(180,210,240,0.35)',
        borderRadius: '9999px',
        padding: '0.25rem 0.625rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.target as HTMLButtonElement).style.background = 'rgba(255,200,180,0.35)'
        ;(e.target as HTMLButtonElement).style.color = 'rgba(160,60,40,0.80)'
      }}
      onMouseLeave={e => {
        (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.40)'
        ;(e.target as HTMLButtonElement).style.color = 'var(--text-muted)'
      }}
    >
      Salir
    </button>
  )
}
