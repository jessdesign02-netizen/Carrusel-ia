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

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="bg-orb w-[500px] h-[500px]" style={{ background: 'radial-gradient(circle, rgba(224,120,80,0.30) 0%, transparent 68%)', top: '-140px', left: '-120px' }} />
      <div className="bg-orb w-[300px] h-[300px]" style={{ background: 'radial-gradient(circle, rgba(237,160,128,0.25) 0%, transparent 65%)', bottom: '-60px', right: '-60px' }} />

      <div className="w-full max-w-[340px] relative z-10 animate-fade-in-up">
        <div className="card-glow px-7 py-10 text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-5 animate-float-slow flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #d4edda, #52b26b 60%, #3a9455)',
              boxShadow: '0 6px 22px rgba(60,148,85,0.30)',
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 300, letterSpacing: '-0.03em', color: '#1A1A1A', marginBottom: '8px' }}>
            ¡Cuenta creada!
          </h2>
          <p style={{ fontSize: '13px', color: '#666666', marginBottom: '28px', lineHeight: 1.6 }}>
            Enviamos un correo de confirmación a <strong style={{ color: '#1A1A1A' }}>{email}</strong>. Haz clic en el enlace para activar tu cuenta.
          </p>
          <a href="/login" className="btn-primary w-full">Ir al login</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      {/* Orbs */}
      <div className="bg-orb w-[500px] h-[500px]" style={{ background: 'radial-gradient(circle, rgba(224,120,80,0.32) 0%, transparent 68%)', top: '-140px', left: '-120px' }} />
      <div className="bg-orb w-[360px] h-[360px]" style={{ background: 'radial-gradient(circle, rgba(237,160,128,0.28) 0%, transparent 65%)', bottom: '-80px', right: '-80px' }} />
      <div className="bg-orb w-[200px] h-[200px] animate-pulse-glow" style={{ background: 'radial-gradient(circle, rgba(245,201,181,0.50) 0%, transparent 65%)', top: '28%', right: '12%' }} />

      <div className="w-full max-w-[340px] relative z-10 animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-1">
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(210,110,70,0.72)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Carrusel IA
          </span>
          <a href="/login" style={{ fontSize: '13px', fontWeight: 400, color: '#1A1A1A', textDecoration: 'none', letterSpacing: '-0.01em' }}>
            ← Iniciar sesión
          </a>
        </div>

        {/* Orb decorativo */}
        <div className="flex justify-center mb-[-28px] relative z-10 pointer-events-none">
          <div
            className="w-14 h-14 rounded-full animate-float-slow"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #F5C9B5, #E07850 60%, #C05030)',
              boxShadow: '0 8px 28px rgba(224,120,80,0.45), inset 0 -2px 4px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.35)',
            }}
          />
        </div>

        {/* Card */}
        <div className="card-glow px-7 pt-12 pb-8">

          <h2 style={{ fontSize: '22px', fontWeight: 300, letterSpacing: '-0.03em', color: '#1A1A1A', marginBottom: '6px' }}>
            Crear cuenta
          </h2>
          <p style={{ fontSize: '13px', color: '#999999', marginBottom: '24px', lineHeight: 1.5 }}>
            Empieza gratis hoy.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="nombre" style={{ display: 'block', fontSize: '11px', color: '#999999', marginBottom: '6px', letterSpacing: '0.02em' }}>
                NOMBRE
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="input-glow"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '11px', color: '#999999', marginBottom: '6px', letterSpacing: '0.02em' }}>
                EMAIL
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
              <label htmlFor="password" style={{ display: 'block', fontSize: '11px', color: '#999999', marginBottom: '6px', letterSpacing: '0.02em' }}>
                CONTRASEÑA
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-glow"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmar" style={{ display: 'block', fontSize: '11px', color: '#999999', marginBottom: '6px', letterSpacing: '0.02em' }}>
                CONFIRMAR
              </label>
              <input
                id="confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                className="input-glow"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p style={{ fontSize: '12px', color: '#C05030', background: 'rgba(217,96,64,0.08)', border: '1px solid rgba(217,96,64,0.18)', borderRadius: '10px', padding: '10px 14px' }}>
                {error}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  background: '#1A1A1A',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  opacity: loading ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(26,26,26,0.22)',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
              >
                {loading
                  ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '→'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
