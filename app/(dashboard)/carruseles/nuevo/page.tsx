import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CarruselForm from '@/components/carruseles/CarruselForm'
import type { Marca } from '@/types'

export default async function NuevoCarruselPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'editor') redirect('/carruseles')

  const { data: marcas } = await supabase
    .from('marcas')
    .select('*')
    .order('nombre')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo carrusel</h1>
        <p className="text-sm text-gray-500 mt-1">
          La IA generará la composición visual de cada slide según la guía de marca.
        </p>
      </div>

      <CarruselForm marcas={(marcas ?? []) as Marca[]} />
    </div>
  )
}
