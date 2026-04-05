'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { marcaSchema, type MarcaFormValues } from '@/lib/validations/marca'

export async function crearMarca(values: MarcaFormValues) {
  const parsed = marcaSchema.safeParse(values)
  if (!parsed.success) {
    return { error: 'Datos inválidos', details: parsed.error.flatten() }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marcas')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/marcas')
  redirect(`/marcas/${data.id}`)
}

export async function actualizarMarca(id: string, values: MarcaFormValues) {
  const parsed = marcaSchema.safeParse(values)
  if (!parsed.success) {
    return { error: 'Datos inválidos', details: parsed.error.flatten() }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('marcas')
    .update(parsed.data)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/marcas/${id}`)
  revalidatePath('/marcas')
  return { success: true }
}

export async function eliminarMarca(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('marcas').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/marcas')
  redirect('/marcas')
}

export async function eliminarAsset(assetId: string, marcaId: string, storageUrl: string) {
  const supabase = await createClient()

  // Extraer path del storage desde la URL pública
  const urlParts = storageUrl.split('/assets-marca/')
  if (urlParts.length === 2) {
    await supabase.storage.from('assets-marca').remove([urlParts[1]])
  }

  const { error } = await supabase.from('assets_marca').delete().eq('id', assetId)
  if (error) return { error: error.message }

  revalidatePath(`/marcas/${marcaId}`)
  return { success: true }
}
