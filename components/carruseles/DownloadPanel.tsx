'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { construirZip, descargarBlob } from '@/lib/export/zip-builder'
import type { Slide } from '@/types'

interface Props {
  carruselId:   string
  marcaNombre:  string
  slides:       Slide[]
  publicadoAt:  string | null
}

export default function DownloadPanel({ carruselId, marcaNombre, slides, publicadoAt }: Props) {
  const router = useRouter()
  const [loading,  setLoading]  = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const slidesConJpg = slides.filter((s) => s.url_jpg !== null)
  const totalSlides  = slides.length
  const todosListos  = slidesConJpg.length === totalSlides
  const fecha        = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const marcaSlug    = marcaNombre.toLowerCase().replace(/\s+/g, '_')

  async function handleDescargarZip() {
    if (slidesConJpg.length === 0) {
      setError('Exporta los slides a JPG primero usando los botones individuales.')
      return
    }

    setLoading(true)
    setError(null)
    setProgreso('Preparando archivos...')

    try {
      setProgreso(`Empaquetando ${slidesConJpg.length} slides en ZIP...`)

      const blob = await construirZip(
        slidesConJpg.map((s) => ({
          numero:      s.numero,
          url_jpg:     s.url_jpg!,
          marcaNombre: marcaSlug,
          fecha,
        }))
      )

      const nombreZip = `${marcaSlug}_${fecha}.zip`
      descargarBlob(blob, nombreZip)

      setProgreso('Registrando descarga...')

      // Marcar como publicado
      await fetch(`/api/carruseles/${carruselId}/download`, { method: 'POST' })

      router.refresh()
      setProgreso(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el ZIP')
    } finally {
      setLoading(false)
      setProgreso(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Descarga y exportación</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {todosListos
              ? `${totalSlides} slides listos para descargar`
              : `${slidesConJpg.length} de ${totalSlides} slides exportados a JPG`}
          </p>
          {publicadoAt && (
            <p className="text-xs text-green-600 mt-1">
              Publicado el{' '}
              {new Date(publicadoAt).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <button
          onClick={handleDescargarZip}
          disabled={loading || slidesConJpg.length === 0}
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              {progreso ?? 'Descargando...'}
            </>
          ) : (
            <>
              <DownloadIcon />
              {`Descargar ZIP (${slidesConJpg.length})`}
            </>
          )}
        </button>
      </div>

      {/* Advertencia si faltan JPGs */}
      {!todosListos && slidesConJpg.length < totalSlides && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          Faltan {totalSlides - slidesConJpg.length} slide(s) por exportar a JPG.
          Usa el botón <strong>"Exportar a JPG"</strong> en cada slide o{' '}
          <strong>"Exportar todos"</strong> para generarlos primero.
        </div>
      )}

      {/* Lista de slides individuales */}
      <div className="divide-y divide-gray-100">
        {slides.map((slide) => (
          <div key={slide.id} className="flex items-center justify-between py-2">
            <span className="text-xs text-gray-600">
              Slide {slide.numero}
              <span className="text-gray-400 ml-2 line-clamp-1 max-w-[200px] inline-block align-bottom">
                {slide.copy.slice(0, 50)}{slide.copy.length > 50 ? '...' : ''}
              </span>
            </span>
            {slide.url_jpg ? (
              <a
                href={slide.url_jpg}
                download={`${marcaSlug}_${fecha}_slide${slide.numero}.jpg`}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                JPG ↓
              </a>
            ) : (
              <span className="text-xs text-gray-300">Pendiente</span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
