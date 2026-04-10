'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegistroPage() {
  const router = useRouter()
  const [nombre, setNombre]       = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmar) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6)    { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'Ya existe una cuenta con ese email.'
        : 'Error al crear la cuenta. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    if (data.session) {
      await supabase.from('profiles').update({ nombre }).eq('id', data.user!.id)
      router.push('/dashboard')
      router.refresh()
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const bgStyle = {
    background: 'linear-gradient(135deg, #dce8f8 0%, #e8d8f5 30%, #d0e8f8 60%, #e0d0f5 100%)',
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={bgStyle}>
      <div className="bg-orb animate-float"     style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(180,210,255,0.50) 0%, transparent 70%)', top: -100, left: -100 }} />
      <div className="bg-orb animate-float-rev" style={{ width: 450, height: 450, background: 'radial-gradient(circle, rgba(220,180,255,0.40) 0%, transparent 70%)', bottom: -80, right: -80 }} />

      <div className="w-full max-w-[360px] relative z-10 animate-fade-in-up">
        <div className="glass-l1 px-7 py-10 text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center animate-float-slow"
            style={{
              background: 'rgba(96,200,160,0.25)',
              border: '1px solid rgba(96,200,160,0.45)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: 'var(--accent-positive)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>¡Cuenta creada!</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Enviamos un correo a <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Haz clic en el enlace para activar tu cuenta.
          </p>
          <a href="/login" className="btn-primary w-full">Ir al login</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={bgStyle}>

      <div className="bg-orb animate-float"     style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(180,210,255,0.50) 0%, transparent 70%)', top: -100, left: -100 }} />
      <div className="bg-orb animate-float-rev" style={{ width: 450, height: 450, background: 'radial-gradient(circle, rgba(220,180,255,0.40) 0%, transparent 70%)', bottom: -80, right: -80 }} />
      <div className="bg-orb animate-pulse-glow" style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(128,216,208,0.35) 0%, transparent 70%)', top: '30%', right: '16%' }} />

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
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Crea tu cuenta gratis</p>
        </div>

        {/* Card glass L1 */}
        <div className="glass-l1 px-7 py-8">
          <div className="flex items-center justify-between mb-7">
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Crear cuenta
            </h2>
            <a href="/login" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
              ← Login
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="input-glow" placeholder="Tu nombre" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-glow" placeholder="hola@ejemplo.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-glow" placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Confirmar</label>
              <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required className="input-glow" placeholder="••••••••" />
            </div>

            {error && (
              <p style={{ fontSize: '12px', color: 'var(--accent-negative)', background: 'rgba(240,128,128,0.12)', border: '1px solid rgba(240,128,128,0.25)', borderRadius: 10, padding: '10px 14px' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </>
              ) : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
