import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarcaForm from '@/components/marcas/MarcaForm'

export default async function NuevaMarcaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'editor') redirect('/marcas')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva marca</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura la identidad visual de la marca
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <MarcaForm />
      </div>
    </div>
  )
}
