'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      {/* Orbs de fondo */}
      <div className="bg-orb w-96 h-96" style={{ background: 'radial-gradient(circle, rgba(253,216,122,0.28) 0%, transparent 70%)', top: '-80px', left: '-60px' }} />
      <div className="bg-orb w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(168,216,216,0.22) 0%, transparent 70%)', bottom: '-60px', right: '-40px' }} />
      <div className="bg-orb w-64 h-64 animate-pulse-glow" style={{ background: 'radial-gradient(circle, rgba(184,168,212,0.18) 0%, transparent 70%)', top: '40%', right: '15%' }} />

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[18px] mb-4 animate-float-slow" style={{
            background: 'linear-gradient(135deg, #FDD87A 0%, #FFBFA0 50%, #B8A8D4 100%)',
            boxShadow: 'inset 0 1.5px 1px rgba(255,255,255,0.80), 0 4px 20px rgba(253,216,122,0.50)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>✦</span>
          </div>
          <h1 className="text-2xl" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Carrusel IA</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Generador de carruseles con IA</p>
        </div>

        {/* Card */}
        <div className="card-glow p-8">
          <h2 className="text-base mb-6" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs mb-1.5" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-glow"
                placeholder="hola@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs mb-1.5" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-glow"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-2xl" style={{ color: 'rgba(180,60,60,0.85)', background: 'rgba(255,200,200,0.30)', border: '1px solid rgba(255,180,180,0.40)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <a href="/registro" className="font-medium" style={{ color: 'rgba(130,80,180,0.85)', textDecoration: 'underline' }}>Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  )
}
