import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { componerSlide } from '@/lib/ai/slide-composer'
import { generarImagenIA } from '@/lib/fal/client'
import type { Marca, AssetMarca, Slide, EnfoqueCarrusel } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 })
  }

  const { carruselId } = await request.json()
  if (!carruselId) {
    return new Response(JSON.stringify({ error: 'carruselId requerido' }), { status: 400 })
  }

  const { data: carrusel, error: carruselError } = await supabase
    .from('carruseles')
    .select('*, marca:marcas(*)')
    .eq('id', carruselId)
    .single()

  if (carruselError || !carrusel) {
    return new Response(JSON.stringify({ error: 'Carrusel no encontrado' }), { status: 404 })
  }

  const { data: assets } = await supabase
    .from('assets_marca')
    .select('*')
    .eq('marca_id', carrusel.marca_id)

  const { data: slides } = await supabase
    .from('slides')
    .select('*')
    .eq('carrusel_id', carruselId)
    .order('numero')

  if (!slides || slides.length === 0) {
    return new Response(JSON.stringify({ error: 'No hay slides' }), { status: 400 })
  }

  const marca            = carrusel.marca as Marca
  const assetsLista      = (assets ?? []) as AssetMarca[]
  const totalSlides      = slides.length
  const imagenReferencia = carrusel.imagen_referencia as string | null ?? null

  // Streaming SSE para mostrar progreso en tiempo real
  const encoder = new TextEncoder()
  const stream  = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({ type: 'start', total: totalSlides })

      let ok = 0
      let errors = 0

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as Slide
        send({ type: 'progress', slide: i + 1, total: totalSlides, label: `Componiendo slide ${i + 1} de ${totalSlides}…` })

        try {
          const { composicion, promptUsado } = await componerSlide({
            marca,
            assets:           assetsLista,
            slide,
            index:            i,
            totalSlides,
            enfoque:          carrusel.enfoque as EnfoqueCarrusel,
            imagenReferencia,
          })

          if (composicion.generarImagen && composicion.promptImagen && process.env.FAL_KEY) {
            send({ type: 'progress', slide: i + 1, total: totalSlides, label: `Generando imagen para slide ${i + 1}…` })
            const falUrl = await generarImagenIA(composicion.promptImagen)
            if (falUrl) {
              const permanentUrl = await descargarYSubirImagen(
                falUrl,
                supabase,
                `ai/${carruselId}_slide${i + 1}_${Date.now()}.jpg`
              )
              composicion.imagenGeneradaUrl = permanentUrl ?? falUrl
            }
          }

          const { error: updateError } = await supabase
            .from('slides')
            .update({ composicion, prompt_usado: promptUsado })
            .eq('id', slide.id)

          if (updateError) {
            send({ type: 'slideError', slide: i + 1, error: updateError.message })
            errors++
          } else {
            send({ type: 'slideDone', slide: i + 1 })
            ok++
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error desconocido'
          console.error(`[generar] Error en slide ${i + 1}:`, msg)
          send({ type: 'slideError', slide: i + 1, error: msg })
          errors++
        }
      }

      send({
        type:    'done',
        success: errors === 0,
        ok,
        errors,
        message: errors === 0
          ? `${totalSlides} slides generados correctamente`
          : `${ok}/${totalSlides} slides generados (${errors} errores)`,
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

async function descargarYSubirImagen(
  url: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string
): Promise<string | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const buffer      = await response.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('slides-generados')
      .upload(path, buffer, { contentType, upsert: true })

    if (uploadError) {
      console.error('[generar] Error re-subiendo imagen:', uploadError.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('slides-generados')
      .getPublicUrl(path)

    return urlData.publicUrl
  } catch (err) {
    console.error('[generar] Error descargando imagen:', err)
    return null
  }
}
