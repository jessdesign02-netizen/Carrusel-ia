import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarcaForm from '@/components/marcas/MarcaForm'
import AssetSection from '@/components/marcas/AssetSection'
import type { Marca, AssetMarca } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MarcaDetallePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isEditor = profile?.rol === 'editor'

  const [{ data: marca }, { data: assets }] = await Promise.all([
    supabase.from('marcas').select('*').eq('id', id).single(),
    supabase.from('assets_marca').select('*').eq('marca_id', id).order('created_at', { ascending: false }),
  ])

  if (!marca) notFound()

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{(marca as Marca).nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">Guía de marca y assets</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/marcas"
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg transition-colors"
          >
            ← Volver
          </a>
        </div>
      </div>

      {/* Paleta de colores — vista rápida */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3 items-center flex-wrap">
          {Object.entries((marca as Marca).colores ?? {}).map(([key, hex]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full border border-gray-200"
                style={{ backgroundColor: hex as string }}
              />
              <div>
                <p className="text-xs font-medium text-gray-700 capitalize">{key}</p>
                <p className="text-xs text-gray-400 font-mono">{hex as string}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de edición */}
      {isEditor && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Editar guía de marca</h2>
          <MarcaForm marca={marca as Marca} />
        </div>
      )}

      {/* Assets */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AssetSection
          marcaId={id}
          initialAssets={(assets ?? []) as AssetMarca[]}
          isEditor={isEditor}
        />
      </div>
    </div>
  )
}
