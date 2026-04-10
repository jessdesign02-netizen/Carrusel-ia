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
      marca_id:          parsed.data.marca_id,
      enfoque:           parsed.data.enfoque,
      estado:            'borrador',
      version:           1,
      created_by:        user.id,
      imagen_referencia: parsed.data.imagen_referencia ?? null,
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

export async function duplicarCarrusel(carruselId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'editor') return { error: 'Sin permisos' }

  const { data: original, error: fetchError } = await supabase
    .from('carruseles')
    .select('marca_id, enfoque, slides(numero, copy, sugerencia_visual)')
    .eq('id', carruselId)
    .single()

  if (fetchError || !original) return { error: 'Carrusel no encontrado' }

  // Crear nuevo carrusel en borrador
  const { data: nuevo, error: insertError } = await supabase
    .from('carruseles')
    .insert({
      marca_id:   original.marca_id,
      enfoque:    original.enfoque,
      estado:     'borrador',
      version:    1,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertError || !nuevo) return { error: insertError?.message ?? 'Error al duplicar' }

  // Copiar slides sin composición ni JPG
  const slides = (original.slides as Array<{ numero: number; copy: string; sugerencia_visual: string | null }>)
    .sort((a, b) => a.numero - b.numero)
    .map((s) => ({
      carrusel_id:       nuevo.id,
      numero:            s.numero,
      copy:              s.copy,
      sugerencia_visual: s.sugerencia_visual ?? null,
    }))

  const { error: slidesError } = await supabase.from('slides').insert(slides)
  if (slidesError) return { error: slidesError.message }

  revalidatePath('/carruseles')
  redirect(`/carruseles/${nuevo.id}`)
}

export async function eliminarCarrusel(carruselId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'editor') return { error: 'Sin permisos' }

  // Solo se puede eliminar en borrador o con_cambios
  const { data: carrusel } = await supabase
    .from('carruseles')
    .select('estado')
    .eq('id', carruselId)
    .single()

  if (!carrusel) return { error: 'Carrusel no encontrado' }
  if (carrusel.estado === 'en_revision' || carrusel.estado === 'aprobado') {
    return { error: 'No se puede eliminar un carrusel en revisión o aprobado' }
  }

  const { error } = await supabase.from('carruseles').delete().eq('id', carruselId)
  if (error) return { error: error.message }

  revalidatePath('/carruseles')
  redirect('/carruseles')
}

export async function actualizarSlide(
  slideId: string,
  carruselId: string,
  data: { copy: string; sugerencia_visual?: string | null }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'editor') return { error: 'Sin permisos' }

  // Verificar que el slide pertenece al carrusel y que el carrusel es editable
  const { data: slideCheck } = await supabase
    .from('slides')
    .select('carrusel_id, carruseles!inner(estado)')
    .eq('id', slideId)
    .eq('carrusel_id', carruselId)
    .single()

  if (!slideCheck) return { error: 'Slide no encontrado en este carrusel' }

  const carruselRel = slideCheck.carruseles as unknown as { estado: string } | { estado: string }[]
  const estadoCarrusel = Array.isArray(carruselRel) ? carruselRel[0]?.estado : carruselRel?.estado
  if (estadoCarrusel !== 'borrador' && estadoCarrusel !== 'con_cambios') {
    return { error: 'El carrusel no está en estado editable' }
  }

  const { error } = await supabase
    .from('slides')
    .update({
      copy:              data.copy.trim(),
      sugerencia_visual: data.sugerencia_visual ?? null,
      composicion:       null,
      url_jpg:           null,
    })
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

export async function actualizarNotas(carruselId: string, notas: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('carruseles')
    .update({ notas: notas.trim() || null })
    .eq('id', carruselId)

  if (error) return { error: error.message }

  revalidatePath(`/carruseles/${carruselId}`)
  return { success: true }
}
