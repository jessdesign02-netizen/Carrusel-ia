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
      className="w-full text-left"
      style={{
        fontSize: '12px',
        color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.25)',
        border: '1px solid rgba(255,255,255,0.45)',
        borderRadius: 8,
        padding: '0.35rem 0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.background = 'rgba(240,160,192,0.15)'
        el.style.borderColor = 'rgba(240,160,192,0.40)'
        el.style.color = '#F0A0C0'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.background = 'rgba(255,255,255,0.25)'
        el.style.borderColor = 'rgba(255,255,255,0.45)'
        el.style.color = 'var(--text-muted)'
      }}
    >
      Cerrar sesión
    </button>
  )
}
