import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { componerSlide } from '@/lib/ai/slide-composer'
import { generarImagenIA } from '@/lib/fal/client'
import type { Marca, AssetMarca, Slide, EnfoqueCarrusel } from '@/types'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slideId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Cargar slide + carrusel + marca + assets
  const { data: slide, error: slideError } = await supabase
    .from('slides')
    .select('*, carruseles!inner(id, enfoque, marca_id, marca:marcas(*))')
    .eq('id', slideId)
    .single()

  if (slideError || !slide) {
    return NextResponse.json({ error: 'Slide no encontrado' }, { status: 404 })
  }

  const carrusel     = slide.carruseles as unknown as { id: string; enfoque: string; marca_id: string; marca: Marca }
  const marca        = carrusel.marca as Marca
  const carruselId   = carrusel.id

  // Contar total de slides del carrusel para determinar posición
  const { count: totalSlides } = await supabase
    .from('slides')
    .select('*', { count: 'exact', head: true })
    .eq('carrusel_id', carruselId)

  const { data: assets } = await supabase
    .from('assets_marca')
    .select('*')
    .eq('marca_id', carrusel.marca_id)

  const assetsLista = (assets ?? []) as AssetMarca[]
  const index       = (slide.numero as number) - 1
  const total       = totalSlides ?? 1

  try {
    const { composicion, promptUsado } = await componerSlide({
      marca,
      assets:      assetsLista,
      slide:       slide as unknown as Slide,
      index,
      totalSlides: total,
      enfoque:     carrusel.enfoque as EnfoqueCarrusel,
    })

    if (composicion.generarImagen && composicion.promptImagen && process.env.FAL_KEY) {
      const falUrl = await generarImagenIA(composicion.promptImagen)
      if (falUrl) {
        const permanentUrl = await descargarYSubir(
          falUrl,
          supabase,
          `ai/${carruselId}_slide${slide.numero}_${Date.now()}.jpg`
        )
        composicion.imagenGeneradaUrl = permanentUrl ?? falUrl
      }
    }

    const { error: updateError } = await supabase
      .from('slides')
      .update({ composicion, prompt_usado: promptUsado, url_jpg: null })
      .eq('id', slideId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ success: true, composicion })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function descargarYSubir(
  url: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string
): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buffer      = await res.arrayBuffer()
    const { error }   = await supabase.storage
      .from('slides-generados')
      .upload(path, buffer, { contentType, upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('slides-generados').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return null
  }
}
