'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toJpeg } from 'html-to-image'
import { createClient } from '@/lib/supabase/client'
import SlideRenderer from '@/components/slides/SlideRenderer'
import type { Slide, ComposicionSlide } from '@/types'

interface Props {
  slides:     Slide[]
  marcaNombre: string
}

const SLIDE_SIZE = 1080

export default function ExportarTodos({ slides, marcaNombre }: Props) {
  const router  = useRouter()
  const [loading,   setLoading]   = useState(false)
  const [progreso,  setProgreso]  = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  const slidesConComp = slides.filter((s) => s.composicion !== null)
  if (slidesConComp.length === 0) return null

  async function handleExportarTodos() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const fecha    = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const nombreBase = marcaNombre.toLowerCase().replace(/\s+/g, '_')

    for (let i = 0; i < slidesConComp.length; i++) {
      const slide = slidesConComp[i]
      setProgreso(`Exportando slide ${i + 1} de ${slidesConComp.length}...`)

      try {
        // Crear contenedor temporal invisible
        const container = document.createElement('div')
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
          setTimeout(resolve, 300) // esperar render
        })

        const dataUrl = await toJpeg(container.firstChild as HTMLElement, {
          width:      SLIDE_SIZE,
          height:     SLIDE_SIZE,
          quality:    0.95,
          pixelRatio: 1,
          skipAutoScale: true,
        })

        root.unmount()
        document.body.removeChild(container)

        // Subir a Storage
        const res  = await fetch(dataUrl)
        const blob = await res.blob()
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

        // Trigger descarga en el navegador con nombre correcto
        const a = document.createElement('a')
        a.href     = dataUrl
        a.download = `${nombreBase}_${fecha}_slide${slide.numero}.jpg`
        a.click()

        // Pequeña pausa entre slides
        await new Promise((r) => setTimeout(r, 200))
      } catch (err: unknown) {
        console.error(`Error en slide ${slide.numero}:`, err)
        setError(`Error en slide ${slide.numero}: ${err instanceof Error ? err.message : 'desconocido'}`)
        break
      }
    }

    setProgreso(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExportarTodos}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            {progreso ?? 'Exportando...'}
          </>
        ) : (
          `Exportar todos (${slidesConComp.length} slides)`
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
