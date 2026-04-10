'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toJpeg } from 'html-to-image'
import { createClient } from '@/lib/supabase/client'
import SlideRenderer from './SlideRenderer'
import { useToast } from '@/components/ui/ToastProvider'
import type { ComposicionSlide } from '@/types'

interface Props {
  slideId:     string
  numero:      number
  total:       number
  composicion: ComposicionSlide
  urlJpg:      string | null
  onExported:  (url: string) => void
  puedeEditar?: boolean
}

const SLIDE_SIZE = 1080

/** Carga una fuente de Google Fonts dinámicamente y espera a que esté lista. */
async function loadGoogleFont(fontName: string) {
  if (!fontName || fontName === 'Inter' || fontName === 'system-ui') return

  // Si la fuente ya está registrada en document.fonts, no recargar
  const already = [...document.fonts].some(
    (f) => f.family.replace(/['"]/g, '').toLowerCase() === fontName.toLowerCase()
  )
  if (already) {
    await document.fonts.ready
    return
  }

  const encoded  = fontName.replace(/ /g, '+')
  const href     = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,700;0,800;1,400&display=swap`
  const existing = document.querySelector(`link[href="${href}"]`)

  if (!existing) {
    const link  = document.createElement('link')
    link.rel    = 'stylesheet'
    link.href   = href
    document.head.appendChild(link)
  }

  // Esperar a que el navegador cargue la fuente
  await document.fonts.ready
}

export default function SlideCapture({ slideId, numero, total, composicion, urlJpg, onExported, puedeEditar = false }: Props) {
  const router       = useRouter()
  const { addToast } = useToast()
  const captureRef   = useRef<HTMLDivElement>(null)
  const [exporting,    setExporting]    = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function handleExport() {
    if (!captureRef.current) return
    setExporting(true)
    setError(null)

    try {
      // Cargar la fuente configurada en la composición
      await loadGoogleFont(composicion.tipografia)

      // Esperar a que las imágenes del DOM estén cargadas
      const imgs = Array.from(captureRef.current.querySelectorAll('img'))
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.onload  = () => res()
                img.onerror = () => res() // no bloquear si falla
              })
        )
      )

      // Pequeña pausa para que las background-image también terminen de renderizar
      await new Promise((r) => setTimeout(r, 300))

      // Capturar el elemento a JPEG a 1080×1080
      const dataUrl = await toJpeg(captureRef.current, {
        width:       SLIDE_SIZE,
        height:      SLIDE_SIZE,
        quality:     0.95,
        pixelRatio:  1,
        skipAutoScale: true,
        // Pasar CORS en todas las peticiones de recursos externos
        fetchRequestInit: { cache: 'no-store', mode: 'cors' },
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
      addToast(`Slide ${numero} exportado`)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al exportar'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setExporting(false)
    }
  }

  async function handleRegenerar() {
    setRegenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/slides/${slideId}/generar`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const msg = data.error ?? 'Error al regenerar'
        setError(msg)
        addToast(msg, 'error')
      } else {
        addToast(`Slide ${numero} regenerado`)
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de red'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview del slide (escalado a 360×360) */}
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

        {puedeEditar && (
          <button
            onClick={handleRegenerar}
            disabled={regenerating || exporting}
            className="w-full text-xs text-gray-400 hover:text-indigo-600 hover:underline transition-colors disabled:opacity-50 py-0.5"
          >
            {regenerating ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="animate-spin inline-block w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                Regenerando…
              </span>
            ) : (
              'Regenerar solo este slide'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
