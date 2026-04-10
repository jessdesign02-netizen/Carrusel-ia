'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId:    string
  email:     string
  nombre:    string
  rol:       string
  avatarUrl: string | null
  bio:       string
  createdAt: string | null
}

const ROL_LABEL: Record<string, string> = {
  editor:  'Editor',
  revisor: 'Revisor',
}

export default function SesionClient({ userId, email, nombre: initialNombre, rol, avatarUrl: initialAvatar, bio: initialBio, createdAt }: Props) {
  const router = useRouter()

  const [nombre, setNombre]       = useState(initialNombre)
  const [bio, setBio]             = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatar)

  const [saving, setSaving]             = useState(false)
  const [uploadingAvatar, setUploading] = useState(false)
  const [saveOk, setSaveOk]             = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)
  const [uploadError, setUploadError]   = useState<string | null>(null)

  const [pwActual, setPwActual]     = useState('')
  const [pwNueva, setPwNueva]       = useState('')
  const [pwConfirm, setPwConfirm]   = useState('')
  const [savingPw, setSavingPw]     = useState(false)
  const [pwOk, setPwOk]             = useState(false)
  const [pwError, setPwError]       = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Avatar upload ──────────────────────────────────────────
  async function handleAvatarChange(file: File) {
    setUploading(true)
    setUploadError(null)
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)

    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `avatares/${userId}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('assets-marca')
        .upload(path, file, { contentType: file.type, upsert: true })

      if (uploadErr) { setUploadError('Error al subir la imagen.'); setAvatarPreview(avatarUrl); return }

      const { data } = supabase.storage.from('assets-marca').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    } catch {
      setUploadError('Error inesperado.')
      setAvatarPreview(avatarUrl)
    } finally {
      setUploading(false)
    }
  }

  // ── Save profile ───────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    setSaveOk(false)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ nombre: nombre.trim(), bio: bio.trim(), avatar_url: avatarUrl })
        .eq('id', userId)

      if (error) { setSaveError('No se pudo guardar. Inténtalo de nuevo.'); return }
      setSaveOk(true)
      router.refresh()
      setTimeout(() => setSaveOk(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // ── Change password ────────────────────────────────────────
  async function handlePasswordChange() {
    setPwError(null)
    setPwOk(false)
    if (!pwNueva || pwNueva.length < 6) { setPwError('La nueva contraseña debe tener al menos 6 caracteres.'); return }
    if (pwNueva !== pwConfirm)          { setPwError('Las contraseñas no coinciden.'); return }

    setSavingPw(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: pwNueva })
      if (error) { setPwError('No se pudo cambiar la contraseña.'); return }
      setPwOk(true)
      setPwActual(''); setPwNueva(''); setPwConfirm('')
      setTimeout(() => setPwOk(false), 3000)
    } finally {
      setSavingPw(false)
    }
  }

  // ── Logout ─────────────────────────────────────────────────
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Initials fallback ──────────────────────────────────────
  const initials = (nombre || email).slice(0, 2).toUpperCase()

  return (
    <div className="space-y-4">

      {/* ── Foto de perfil + datos básicos ─────────────────── */}
      <section className="glass-l1 p-6">
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
          Perfil
        </p>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden group"
              style={{
                background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, rgba(122,184,245,0.35) 0%, rgba(192,168,240,0.35) 100%)',
                border: '2px solid rgba(255,255,255,0.70)',
                boxShadow: '0 4px 16px rgba(120,160,220,0.18)',
              }}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--accent-blue)' }}>{initials}</span>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.32)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.60)' }}>
                  <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f) }}
            />
          </div>

          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {nombre || email.split('@')[0]}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{email}</p>
            <span style={{
              display: 'inline-block', marginTop: 6,
              fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
              padding: '2px 10px', borderRadius: 999,
              background: 'rgba(122,184,245,0.18)',
              border: '1px solid rgba(122,184,245,0.35)',
              color: 'var(--accent-blue)',
            }}>
              {ROL_LABEL[rol] ?? rol}
            </span>
          </div>
        </div>

        {uploadError && <p style={{ fontSize: 12, color: 'var(--accent-negative)', marginBottom: 12 }}>{uploadError}</p>}

        {/* Nombre */}
        <div className="space-y-3">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-glow"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="input-glow"
              style={{ opacity: 0.55, cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Bio <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="input-glow"
              placeholder="Una línea sobre ti o tu equipo…"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}>
          {saveOk ? (
            <span style={{ fontSize: 12, color: 'var(--accent-positive)', fontWeight: 500 }}>✓ Cambios guardados</span>
          ) : saveError ? (
            <span style={{ fontSize: 12, color: 'var(--accent-negative)' }}>{saveError}</span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {createdAt ? `Cuenta creada el ${new Date(createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={saving ? { opacity: 0.6 } : {}}
          >
            {saving ? (
              <><span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando…</>
            ) : 'Guardar cambios'}
          </button>
        </div>
      </section>

      {/* ── Cambiar contraseña ─────────────────────────────────── */}
      <section className="glass-l1 p-6">
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
          Seguridad
        </p>

        <div className="space-y-3">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Nueva contraseña
            </label>
            <input
              type="password"
              value={pwNueva}
              onChange={(e) => setPwNueva(e.target.value)}
              className="input-glow"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              className="input-glow"
              placeholder="••••••••"
            />
          </div>
        </div>

        {pwOk && (
          <p style={{ fontSize: 12, color: 'var(--accent-positive)', fontWeight: 500, marginTop: 12 }}>✓ Contraseña actualizada</p>
        )}
        {pwError && (
          <p style={{ fontSize: 12, color: 'var(--accent-negative)', marginTop: 12 }}>{pwError}</p>
        )}

        <div className="flex justify-end mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}>
          <button
            type="button"
            onClick={handlePasswordChange}
            disabled={savingPw || !pwNueva}
            className="btn-secondary"
            style={(savingPw || !pwNueva) ? { opacity: 0.5 } : {}}
          >
            {savingPw ? (
              <><span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Actualizando…</>
            ) : 'Cambiar contraseña'}
          </button>
        </div>
      </section>

      {/* ── Cerrar sesión ──────────────────────────────────────── */}
      <section className="glass-l1 p-6">
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
          Sesión
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Cerrar sesión</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Saldrás de tu cuenta en este dispositivo.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.25rem',
              background: 'rgba(240,128,128,0.14)',
              border: '1px solid rgba(240,128,128,0.30)',
              borderRadius: 999,
              fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em',
              color: 'var(--accent-negative)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = 'rgba(240,128,128,0.24)'
              el.style.borderColor = 'rgba(240,128,128,0.50)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'rgba(240,128,128,0.14)'
              el.style.borderColor = 'rgba(240,128,128,0.30)'
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </section>

    </div>
  )
}
