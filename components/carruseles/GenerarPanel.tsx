'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  carruselId:   string
  totalSlides:  number
  yaGenerado:   boolean
}

interface SseEvent {
  type:     string
  slide?:   number
  total?:   number
  label?:   string
  error?:   string
  success?: boolean
  message?: string
  ok?:      number
  errors?:  number
}

export default function GenerarPanel({ carruselId, totalSlides, yaGenerado }: Props) {
  const router    = useRouter()
  const [loading,  setLoading]  = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [avance,   setAvance]   = useState<number>(0)   // 0-100
  const [error,    setError]    = useState<string | null>(null)

  async function handleGenerar() {
    setLoading(true)
    setError(null)
    setAvance(0)
    setProgreso('Iniciando generación…')

    try {
      const res = await fetch('/api/carruseles/generar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ carruselId }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Error al iniciar la generación')
        setLoading(false)
        setProgreso(null)
        return
      }

      // Leer el stream SSE
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''   // conservar línea incompleta

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6)) as SseEvent

            if (evt.type === 'start') {
              setProgreso(`Preparando ${evt.total} slides…`)
              setAvance(0)
            }

            if (evt.type === 'progress' && evt.slide && evt.total) {
              setProgreso(evt.label ?? `Slide ${evt.slide}/${evt.total}…`)
              setAvance(Math.round(((evt.slide - 1) / evt.total) * 90))
            }

            if (evt.type === 'slideDone' && evt.slide && totalSlides) {
              setAvance(Math.round((evt.slide / totalSlides) * 95))
            }

            if (evt.type === 'slideError') {
              console.warn(`[generar] Error en slide ${evt.slide}: ${evt.error}`)
            }

            if (evt.type === 'done') {
              setAvance(100)
              if (!evt.success) {
                setError(evt.message ?? 'Algunos slides fallaron')
              } else {
                setProgreso(evt.message ?? 'Generado')
              }
              setTimeout(() => {
                router.refresh()
                setLoading(false)
                setProgreso(null)
                setAvance(0)
              }, 600)
            }
          } catch {
            // ignorar líneas mal formadas
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de red')
      setLoading(false)
      setProgreso(null)
      setAvance(0)
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-indigo-900">
            {yaGenerado ? 'Regenerar composiciones' : 'Generar composiciones con IA'}
          </h3>
          <p className="text-xs text-indigo-700 mt-1">
            {yaGenerado
              ? 'La IA rediseñará todos los slides usando la guía de marca.'
              : `La IA diseñará la composición de los ${totalSlides} slides respetando colores y tipografía de la marca.`}
          </p>

          {/* Barra de progreso */}
          {loading && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full flex-shrink-0" />
                <p className="text-xs text-indigo-700 font-medium truncate">{progreso}</p>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${avance}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mt-2">{error}</p>
          )}
        </div>

        <button
          onClick={handleGenerar}
          disabled={loading}
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? 'Generando…' : yaGenerado ? 'Regenerar' : 'Generar con IA'}
        </button>
      </div>
    </div>
  )
}
