import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MarcaForm from '@/components/marcas/MarcaForm'
import AssetSection from '@/components/marcas/AssetSection'
import TipografiaPreview from '@/components/marcas/TipografiaPreview'
import type { Marca, AssetMarca, TipoAsset } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('marcas').select('nombre').eq('id', id).single()
  if (!data) return { title: 'Marca — Carrusel IA' }
  return { title: `${data.nombre} — Carrusel IA` }
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

  const [
    { data: marca },
    { data: assets },
    { count: nBorrador },
    { count: nEnRevision },
    { count: nConCambios },
    { count: nAprobado },
  ] = await Promise.all([
    supabase.from('marcas').select('*').eq('id', id).single(),
    supabase.from('assets_marca').select('*').eq('marca_id', id).order('created_at', { ascending: false }),
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('marca_id', id).eq('estado', 'borrador'),
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('marca_id', id).eq('estado', 'en_revision'),
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('marca_id', id).eq('estado', 'con_cambios'),
    supabase.from('carruseles').select('*', { count: 'exact', head: true }).eq('marca_id', id).eq('estado', 'aprobado'),
  ])

  if (!marca) notFound()

  // Asset counts per type
  const TIPOS: TipoAsset[] = ['logo', 'fondo', 'icono', 'elemento', 'foto', 'efecto']
  const assetsList = (assets ?? []) as AssetMarca[]
  const assetPorTipo = TIPOS.reduce<Record<TipoAsset, number>>((acc, t) => {
    acc[t] = assetsList.filter((a) => a.tipo === t).length
    return acc
  }, {} as Record<TipoAsset, number>)

  const totalCarruseles = (nBorrador ?? 0) + (nEnRevision ?? 0) + (nConCambios ?? 0) + (nAprobado ?? 0)

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

      {/* Tipografías */}
      {(marca as Marca).tipografias?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Tipografías</h2>
          <TipografiaPreview tipografias={(marca as Marca).tipografias} />
        </div>
      )}

      {/* Estadísticas de carruseles */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Carruseles
            <span className="ml-2 text-gray-400 font-normal">{totalCarruseles} en total</span>
          </h2>
          {totalCarruseles > 0 && (
            <a
              href={`/carruseles?marcaId=${id}`}
              className="text-xs text-indigo-600 hover:underline"
            >
              Ver todos →
            </a>
          )}
        </div>

        {totalCarruseles === 0 ? (
          <p className="text-xs text-gray-400">
            Aún no hay carruseles para esta marca.{' '}
            {isEditor && (
              <a href="/carruseles/nuevo" className="text-indigo-600 hover:underline">
                Crear el primero →
              </a>
            )}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Borradores',   count: nBorrador ?? 0,   color: 'text-gray-600',  bg: 'bg-gray-50',   estado: 'borrador' },
              { label: 'En revisión',  count: nEnRevision ?? 0, color: 'text-yellow-700', bg: 'bg-yellow-50', estado: 'en_revision' },
              { label: 'Con cambios',  count: nConCambios ?? 0, color: 'text-red-700',    bg: 'bg-red-50',    estado: 'con_cambios' },
              { label: 'Aprobados',    count: nAprobado ?? 0,   color: 'text-green-700',  bg: 'bg-green-50',  estado: 'aprobado' },
            ].map(({ label, count, color, bg, estado }) => (
              <a
                key={estado}
                href={`/carruseles?marcaId=${id}&estado=${estado}`}
                className={`rounded-lg p-3 ${bg} hover:opacity-80 transition-opacity`}
              >
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className={`text-xs mt-0.5 ${color}`}>{label}</p>
              </a>
            ))}
          </div>
        )}
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
        {assetsList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {TIPOS.filter((t) => assetPorTipo[t] > 0).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full capitalize"
              >
                {t}
                <span className="bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-0.5 text-xs font-bold leading-none">
                  {assetPorTipo[t]}
                </span>
              </span>
            ))}
          </div>
        )}
        <AssetSection
          marcaId={id}
          initialAssets={assetsList}
          isEditor={isEditor}
        />
      </div>
    </div>
  )
}
