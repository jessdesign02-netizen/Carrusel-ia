'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  carruselId: string
  totalSlides: number
  yaGenerado: boolean
}

export default function GenerarPanel({ carruselId, totalSlides, yaGenerado }: Props) {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  async function handleGenerar() {
    setLoading(true)
    setError(null)
    setProgreso(`Analizando guía de marca y ${totalSlides} slides...`)

    try {
      const res = await fetch('/api/carruseles/generar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ carruselId }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const errMsg = data.error ?? data.message ?? 'Error en la generación'
        setError(errMsg)
        setLoading(false)
        setProgreso(null)
        return
      }

      setProgreso(data.message)
      setTimeout(() => {
        router.refresh()
        setLoading(false)
        setProgreso(null)
      }, 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de red')
      setLoading(false)
      setProgreso(null)
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-indigo-900">
            {yaGenerado ? 'Regenerar composiciones' : 'Generar composiciones con IA'}
          </h3>
          <p className="text-xs text-indigo-700 mt-1">
            {yaGenerado
              ? 'La IA rediseñará todos los slides usando la guía de marca.'
              : `La IA diseñará la composición visual de los ${totalSlides} slides usando la guía de marca automáticamente.`}
          </p>
          {progreso && (
            <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-2">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full" />
              {progreso}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">{error}</p>
          )}
        </div>
        <button
          onClick={handleGenerar}
          disabled={loading}
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? 'Generando...' : yaGenerado ? 'Regenerar' : 'Generar con IA'}
        </button>
      </div>
    </div>
  )
}
