'use client'

import { useState } from 'react'
import { eliminarCarrusel } from '@/app/(dashboard)/carruseles/actions'
import { useToast } from '@/components/ui/ToastProvider'
import type { EstadoCarrusel } from '@/types'

interface Props {
  carruselId: string
  estado: EstadoCarrusel
}

export default function EliminarCarrusel({ carruselId, estado }: Props) {
  const { addToast } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Solo mostrar en estados eliminables
  if (estado === 'en_revision' || estado === 'aprobado') return null

  async function handleEliminar() {
    setLoading(true)
    setError(null)
    const result = await eliminarCarrusel(carruselId)
    if (result?.error) {
      setError(result.error)
      addToast(result.error, 'error')
      setLoading(false)
      setConfirm(false)
    }
    // Si no hay error, el server action hace redirect a /carruseles
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-sm text-red-500 hover:text-red-700 hover:underline transition-colors"
      >
        Eliminar carrusel
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <p className="text-xs text-red-700 font-medium">¿Eliminar definitivamente?</p>
      <button
        onClick={handleEliminar}
        disabled={loading}
        className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-3 py-1 rounded-lg transition-colors"
      >
        {loading ? 'Eliminando...' : 'Sí, eliminar'}
      </button>
      <button
        onClick={() => { setConfirm(false); setError(null) }}
        disabled={loading}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
