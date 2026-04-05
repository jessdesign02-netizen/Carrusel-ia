import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Verificar que el carrusel está aprobado
  const { data: carrusel } = await supabase
    .from('carruseles')
    .select('estado, marca:marcas(nombre)')
    .eq('id', id)
    .single()

  if (!carrusel) {
    return NextResponse.json({ error: 'Carrusel no encontrado' }, { status: 404 })
  }

  if (carrusel.estado !== 'aprobado') {
    return NextResponse.json(
      { error: 'El carrusel debe estar aprobado para descargarlo' },
      { status: 403 }
    )
  }

  // Marcar como publicado
  const { error } = await supabase
    .from('carruseles')
    .update({ publicado_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
