'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarEstadoCarrusel, guardarVersionCarrusel } from '@/app/(dashboard)/carruseles/actions'
import type { EstadoCarrusel, RolUsuario } from '@/types'

interface Props {
  carruselId: string
  estado:     EstadoCarrusel
  rol:        RolUsuario
  tieneSlidesGenerados: boolean
}

export default function StatusControls({ carruselId, estado, rol, tieneSlidesGenerados }: Props) {
  const router  = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)

  async function cambiarEstado(
    nuevoEstado: EstadoCarrusel,
    feedback?: string
  ) {
    setLoading(true)
    setError(null)

    // Si el revisor solicita cambios → guardar snapshot de versión primero
    if (nuevoEstado === 'con_cambios') {
      await guardarVersionCarrusel(carruselId)
    }

    const result = await actualizarEstadoCarrusel(carruselId, nuevoEstado, feedback)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  if (error) {
    return <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
  }

  // ── Editor ──────────────────────────────────────────────────
  if (rol === 'editor') {
    return (
      <div className="flex flex-wrap gap-2">
        {estado === 'borrador' && tieneSlidesGenerados && (
          <button
            onClick={() => cambiarEstado('en_revision')}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Guardando...' : 'Enviar a revisión'}
          </button>
        )}
        {estado === 'con_cambios' && tieneSlidesGenerados && (
          <button
            onClick={() => cambiarEstado('en_revision')}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Guardando...' : 'Reenviar a revisión'}
          </button>
        )}
        {(estado === 'borrador' || estado === 'con_cambios') && !tieneSlidesGenerados && (
          <p className="text-xs text-gray-400 italic">Genera los slides antes de enviar a revisión.</p>
        )}
        {estado === 'en_revision' && (
          <p className="text-xs text-gray-500 italic">En revisión por el PM. Esperando respuesta...</p>
        )}
        {estado === 'aprobado' && (
          <p className="text-xs text-green-700 font-medium">Aprobado — descarga disponible en la sección de exportación.</p>
        )}
      </div>
    )
  }

  // ── Revisor ──────────────────────────────────────────────────
  return (
    <div className="flex flex-wrap gap-2">
      {estado === 'en_revision' && (
        <>
          <button
            onClick={() => cambiarEstado('aprobado')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? '...' : 'Aprobar'}
          </button>
          <SolicitarCambiosButton
            carruselId={carruselId}
            loading={loading}
            onConfirm={(feedback) => cambiarEstado('con_cambios', feedback)}
          />
        </>
      )}
      {estado === 'aprobado' && (
        <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
          Aprobado por ti
        </span>
      )}
      {(estado === 'borrador' || estado === 'con_cambios') && (
        <span className="text-xs text-gray-400 italic">
          El editor está trabajando en los cambios.
        </span>
      )}
    </div>
  )
}

function SolicitarCambiosButton({
  loading,
  onConfirm,
}: {
  carruselId: string
  loading: boolean
  onConfirm: (feedback: string) => void
}) {
  const [open,     setOpen]     = useState(false)
  const [feedback, setFeedback] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className="border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Solicitar cambios
      </button>
    )
  }

  return (
    <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-red-800">¿Qué cambios necesita este carrusel?</p>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        placeholder="Describe los cambios necesarios..."
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={() => { if (feedback.trim()) onConfirm(feedback) }}
          disabled={loading || !feedback.trim()}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? '...' : 'Confirmar cambios'}
        </button>
        <button
          onClick={() => { setOpen(false); setFeedback('') }}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
