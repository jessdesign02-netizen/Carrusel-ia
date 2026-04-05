'use client'

import { useRef, useState } from 'react'
import { toJpeg } from 'html-to-image'
import { createClient } from '@/lib/supabase/client'
import SlideRenderer from './SlideRenderer'
import type { ComposicionSlide } from '@/types'

interface Props {
  slideId: string
  numero: number
  total: number
  composicion: ComposicionSlide
  urlJpg: string | null
  onExported: (url: string) => void
}

const SLIDE_SIZE = 1080

export default function SlideCapture({ slideId, numero, total, composicion, urlJpg, onExported }: Props) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    if (!captureRef.current) return
    setExporting(true)
    setError(null)

    try {
      // Capturar el elemento a JPEG a 1080x1080
      const dataUrl = await toJpeg(captureRef.current, {
        width:       SLIDE_SIZE,
        height:      SLIDE_SIZE,
        quality:     0.95,
        pixelRatio:  1,
        skipAutoScale: true,
      })

      // Convertir dataUrl a Blob
      const res  = await fetch(dataUrl)
      const blob = await res.blob()

      // Subir a Supabase Storage
      const supabase = createClient()
      const fileName = `${slideId}_v${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('slides-generados')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('slides-generados')
        .getPublicUrl(fileName)

      // Guardar URL en la tabla slides
      await supabase
        .from('slides')
        .update({ url_jpg: urlData.publicUrl })
        .eq('id', slideId)

      onExported(urlData.publicUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview del slide (escalado a 360x360) */}
      <div
        style={{ width: 360, height: 360, position: 'relative', overflow: 'hidden', borderRadius: 12 }}
        className="shadow-lg border border-gray-200"
      >
        {/* Capa invisible para captura a tamaño real */}
        <div
          style={{
            position:        'absolute',
            top:             0,
            left:            0,
            width:           SLIDE_SIZE,
            height:          SLIDE_SIZE,
            transformOrigin: 'top left',
            transform:       `scale(${360 / SLIDE_SIZE})`,
            pointerEvents:   'none',
          }}
        >
          <div ref={captureRef}>
            <SlideRenderer
              composicion={composicion}
              numero={numero}
              total={total}
              exportMode
            />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-col items-center gap-1.5 w-full max-w-[360px]">
        {urlJpg ? (
          <div className="flex gap-2 w-full">
            <a
              href={urlJpg}
              download={`slide_${numero}.jpg`}
              className="flex-1 text-center text-xs font-medium text-indigo-600 border border-indigo-300 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Descargar JPG
            </a>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
            >
              Re-exportar
            </button>
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                Exportando...
              </>
            ) : (
              'Exportar a JPG'
            )}
          </button>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
