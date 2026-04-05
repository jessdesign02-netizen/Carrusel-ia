import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { componerSlide } from '@/lib/ai/slide-composer'
import { generarImagenIA } from '@/lib/fal/client'
import type { Marca, AssetMarca, Slide, EnfoqueCarrusel } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { carruselId } = await request.json()
  if (!carruselId) {
    return NextResponse.json({ error: 'carruselId requerido' }, { status: 400 })
  }

  // Cargar carrusel + marca + assets + slides
  const { data: carrusel, error: carruselError } = await supabase
    .from('carruseles')
    .select('*, marca:marcas(*)')
    .eq('id', carruselId)
    .single()

  if (carruselError || !carrusel) {
    return NextResponse.json({ error: 'Carrusel no encontrado' }, { status: 404 })
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
    return NextResponse.json({ error: 'No hay slides en este carrusel' }, { status: 400 })
  }

  const marca = carrusel.marca as Marca
  const assetsLista = (assets ?? []) as AssetMarca[]
  const totalSlides = slides.length
  const resultados: Array<{ slideId: string; ok: boolean; error?: string }> = []

  // Generar composición para cada slide secuencialmente
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i] as Slide

    try {
      const { composicion, promptUsado } = await componerSlide({
        marca,
        assets: assetsLista,
        slide,
        index: i,
        totalSlides,
        enfoque: carrusel.enfoque as EnfoqueCarrusel,
      })

      // Si la IA decidió generar una imagen y FAL_KEY está configurada
      if (composicion.generarImagen && composicion.promptImagen && process.env.FAL_KEY) {
        const imgUrl = await generarImagenIA(composicion.promptImagen)
        if (imgUrl) {
          composicion.imagenGeneradaUrl = imgUrl
        }
      }

      // Guardar composición en el slide
      const { error: updateError } = await supabase
        .from('slides')
        .update({
          composicion,
          prompt_usado: promptUsado,
        })
        .eq('id', slide.id)

      if (updateError) {
        resultados.push({ slideId: slide.id, ok: false, error: updateError.message })
      } else {
        resultados.push({ slideId: slide.id, ok: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      console.error(`[generar] Error en slide ${i + 1}:`, msg)
      resultados.push({ slideId: slide.id, ok: false, error: msg })
    }
  }

  const todosOk = resultados.every((r) => r.ok)

  return NextResponse.json({
    success: todosOk,
    resultados,
    message: todosOk
      ? `${slides.length} slides generados correctamente`
      : `${resultados.filter(r => r.ok).length}/${slides.length} slides generados`,
  })
}
