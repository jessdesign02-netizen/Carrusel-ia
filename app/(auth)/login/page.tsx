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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #dce8f8 0%, #e8d8f5 30%, #d0e8f8 60%, #e0d0f5 100%)',
    }}>

      {/* Orbs animados */}
      <div className="bg-orb animate-float"     style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(180,210,255,0.50) 0%, transparent 70%)', top: -100, left: -100 }} />
      <div className="bg-orb animate-float-rev" style={{ width: 450, height: 450, background: 'radial-gradient(circle, rgba(220,180,255,0.40) 0%, transparent 70%)', bottom: -80, right: -80 }} />
      <div className="bg-orb animate-pulse-glow" style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(128,216,208,0.35) 0%, transparent 70%)', top: '35%', right: '18%' }} />

      <div className="w-full max-w-[360px] relative z-10 animate-fade-in-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 animate-float-slow" style={{
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.65)',
            boxShadow: '0 4px 16px rgba(120,160,220,0.14), inset 0 1px 0 rgba(255,255,255,0.80)',
          }}>
            <span style={{ fontSize: '1.25rem', color: 'var(--accent-blue)' }}>✦</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Carrusel IA
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Generador de carruseles con IA</p>
        </div>

        {/* Card glass L1 */}
        <div className="glass-l1 px-7 py-8">
          <div className="flex items-center justify-between mb-7">
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Iniciar sesión
            </h2>
            <a href="/registro" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
              Crear cuenta →
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
              </label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Contraseña
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>Olvidé</span>
              </div>
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
              <p style={{
                fontSize: '12px',
                color: 'var(--accent-negative)',
                background: 'rgba(240,128,128,0.12)',
                border: '1px solid rgba(240,128,128,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
              }}>
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
        </div>
      </div>
    </div>
  )
}
