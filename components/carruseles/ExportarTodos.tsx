'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toJpeg } from 'html-to-image'
import { createClient } from '@/lib/supabase/client'
import SlideRenderer from '@/components/slides/SlideRenderer'
import { useToast } from '@/components/ui/ToastProvider'
import type { Slide, ComposicionSlide } from '@/types'

interface Props {
  slides:      Slide[]
  marcaNombre: string
}

const SLIDE_SIZE = 1080

async function loadGoogleFont(fontName: string) {
  if (!fontName || fontName === 'Inter' || fontName === 'system-ui') return

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

  await document.fonts.ready
}

export default function ExportarTodos({ slides, marcaNombre }: Props) {
  const router     = useRouter()
  const { addToast } = useToast()
  const [loading,   setLoading]   = useState(false)
  const [progreso,  setProgreso]  = useState<string | null>(null)
  const [done,      setDone]      = useState(0)
  const [error,     setError]     = useState<string | null>(null)

  const slidesConComp = slides.filter((s) => s.composicion !== null)
  if (slidesConComp.length === 0) return null

  async function handleExportarTodos() {
    setLoading(true)
    setError(null)
    setDone(0)

    const supabase    = createClient()
    const fecha       = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const nombreBase  = marcaNombre.toLowerCase().replace(/\s+/g, '_')

    // Pre-cargar todas las fuentes necesarias antes de empezar
    const fuentes = [...new Set(
      slidesConComp
        .map((s) => (s.composicion as ComposicionSlide).tipografia)
        .filter(Boolean)
    )]
    for (const f of fuentes) {
      await loadGoogleFont(f)
    }

    for (let i = 0; i < slidesConComp.length; i++) {
      const slide = slidesConComp[i]
      setProgreso(`Exportando slide ${i + 1} de ${slidesConComp.length}...`)

      try {
        // Crear contenedor temporal invisible
        const container        = document.createElement('div')
        container.style.position = 'fixed'
        container.style.top      = '-9999px'
        container.style.left     = '-9999px'
        container.style.width    = `${SLIDE_SIZE}px`
        container.style.height   = `${SLIDE_SIZE}px`
        document.body.appendChild(container)

        // Renderizar el slide en el contenedor
        const { createRoot } = await import('react-dom/client')
        const root = createRoot(container)

        await new Promise<void>((resolve) => {
          root.render(
            <SlideRenderer
              composicion={slide.composicion as ComposicionSlide}
              numero={slide.numero}
              total={slidesConComp.length}
              exportMode
            />
          )
          setTimeout(resolve, 400) // esperar render + imágenes background
        })

        // Esperar imágenes <img> dentro del contenedor
        const imgs = Array.from(container.querySelectorAll('img'))
        await Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((res) => {
                  img.onload  = () => res()
                  img.onerror = () => res()
                })
          )
        )

        const dataUrl = await toJpeg(container.firstChild as HTMLElement, {
          width:       SLIDE_SIZE,
          height:      SLIDE_SIZE,
          quality:     0.95,
          pixelRatio:  1,
          skipAutoScale: true,
          fetchRequestInit: { cache: 'no-store', mode: 'cors' },
        })

        root.unmount()
        document.body.removeChild(container)

        // Subir a Storage
        const res      = await fetch(dataUrl)
        const blob     = await res.blob()
        const fileName = `${slide.id}_v${Date.now()}.jpg`

        const { error: uploadErr } = await supabase.storage
          .from('slides-generados')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

        if (uploadErr) throw uploadErr

        const { data: urlData } = supabase.storage
          .from('slides-generados')
          .getPublicUrl(fileName)

        // Guardar URL
        await supabase
          .from('slides')
          .update({ url_jpg: urlData.publicUrl })
          .eq('id', slide.id)

        // Trigger descarga en el navegador
        const a    = document.createElement('a')
        a.href     = dataUrl
        a.download = `${nombreBase}_${fecha}_slide${slide.numero}.jpg`
        a.click()

        setDone(i + 1)
        await new Promise((r) => setTimeout(r, 200))
      } catch (err: unknown) {
        console.error(`Error en slide ${slide.numero}:`, err)
        const msg = `Error en slide ${slide.numero}: ${err instanceof Error ? err.message : 'desconocido'}`
        setError(msg)
        addToast(msg, 'error')
        break
      }
    }

    setProgreso(null)
    setLoading(false)
    if (!error) {
      addToast(`${slidesConComp.length} slides exportados`)
    }
    router.refresh()
  }

  const pct = slidesConComp.length > 0 ? Math.round((done / slidesConComp.length) * 100) : 0

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <button
        onClick={handleExportarTodos}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full flex-shrink-0" />
            <span className="truncate">{progreso ?? 'Preparando…'}</span>
          </>
        ) : (
          `Exportar todos (${slidesConComp.length} slides)`
        )}
      </button>

      {/* Barra de progreso */}
      {loading && (
        <div className="space-y-1">
          <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">{done}/{slidesConComp.length} completados</p>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
