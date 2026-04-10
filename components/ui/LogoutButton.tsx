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
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid #E0E0E0',
        borderRadius: '9999px',
        padding: '0.25rem 0.625rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.target as HTMLButtonElement).style.background = 'rgba(253,240,235,0.80)'
        ;(e.target as HTMLButtonElement).style.color = '#C05030'
        ;(e.target as HTMLButtonElement).style.borderColor = 'rgba(217,96,64,0.30)'
      }}
      onMouseLeave={e => {
        (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.55)'
        ;(e.target as HTMLButtonElement).style.color = 'var(--text-muted)'
        ;(e.target as HTMLButtonElement).style.borderColor = '#E0E0E0'
      }}
    >
      Salir
    </button>
  )
}
