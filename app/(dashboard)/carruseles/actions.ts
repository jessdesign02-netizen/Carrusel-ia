'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { carruselSchema, type CarruselFormValues } from '@/lib/validations/carrusel'

export async function crearCarrusel(values: CarruselFormValues) {
  const parsed = carruselSchema.safeParse(values)
  if (!parsed.success) {
    return { error: 'Datos inválidos', details: parsed.error.flatten() }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // 1. Crear el carrusel
  const { data: carrusel, error: carruselError } = await supabase
    .from('carruseles')
    .insert({
      marca_id:   parsed.data.marca_id,
      enfoque:    parsed.data.enfoque,
      estado:     'borrador',
      version:    1,
      created_by: user.id,
    })
    .select()
    .single()

  if (carruselError) return { error: carruselError.message }

  // 2. Crear los slides
  const slidesData = parsed.data.slides.map((slide, index) => ({
    carrusel_id:       carrusel.id,
    numero:            index + 1,
    copy:              slide.copy,
    sugerencia_visual: slide.sugerencia_visual ?? null,
  }))

  const { error: slidesError } = await supabase.from('slides').insert(slidesData)
  if (slidesError) return { error: slidesError.message }

  revalidatePath('/carruseles')
  redirect(`/carruseles/${carrusel.id}`)
}

export async function actualizarEstadoCarrusel(
  carruselId: string,
  estado: 'borrador' | 'en_revision' | 'aprobado' | 'con_cambios',
  feedbackGeneral?: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('carruseles')
    .update({ estado, ...(feedbackGeneral !== undefined && { feedback_general: feedbackGeneral }) })
    .eq('id', carruselId)

  if (error) return { error: error.message }

  revalidatePath(`/carruseles/${carruselId}`)
  revalidatePath('/carruseles')
  return { success: true }
}

export async function guardarFeedbackSlide(slideId: string, feedback: string, carruselId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('slides')
    .update({ feedback_slide: feedback })
    .eq('id', slideId)

  if (error) return { error: error.message }

  revalidatePath(`/carruseles/${carruselId}`)
  return { success: true }
}

export async function guardarVersionCarrusel(carruselId: string) {
  const supabase = await createClient()

  const { data: carrusel } = await supabase
    .from('carruseles')
    .select('version')
    .eq('id', carruselId)
    .single()

  const { data: slides } = await supabase
    .from('slides')
    .select('*')
    .eq('carrusel_id', carruselId)
    .order('numero')

  if (!slides) return { error: 'No se encontraron slides' }

  await supabase.from('versiones_carrusel').insert({
    carrusel_id:  carruselId,
    version:      carrusel?.version ?? 1,
    slides_data:  slides,
  })

  // Incrementar versión
  await supabase
    .from('carruseles')
    .update({ version: (carrusel?.version ?? 1) + 1 })
    .eq('id', carruselId)

  revalidatePath(`/carruseles/${carruselId}`)
  return { success: true }
}
