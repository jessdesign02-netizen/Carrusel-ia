'use client'

import { useState } from 'react'
import Image from 'next/image'
import { eliminarAsset } from '@/app/(dashboard)/marcas/actions'
import type { AssetMarca, TipoAsset } from '@/types'

interface Props {
  assets: AssetMarca[]
  marcaId: string
  isEditor: boolean
}

const TIPO_LABELS: Record<TipoAsset, string> = {
  logo:     'Logos',
  fondo:    'Fondos',
  icono:    'Iconos',
  elemento: 'Elementos',
  foto:     'Fotos',
  efecto:   'Efectos',
}

const TIPOS_ORDEN: TipoAsset[] = ['logo', 'fondo', 'foto', 'icono', 'elemento', 'efecto']

export default function AssetGallery({ assets, marcaId, isEditor }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const grouped = TIPOS_ORDEN.reduce<Record<TipoAsset, AssetMarca[]>>(
    (acc, tipo) => {
      acc[tipo] = assets.filter((a) => a.tipo === tipo)
      return acc
    },
    {} as Record<TipoAsset, AssetMarca[]>
  )

  async function handleDelete(asset: AssetMarca) {
    if (!confirm(`¿Eliminar este asset?`)) return
    setError(null)
    setDeleting(asset.id)
    const result = await eliminarAsset(asset.id, marcaId, asset.url)
    if (result?.error) setError(result.error)
    setDeleting(null)
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No hay assets subidos todavía.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {TIPOS_ORDEN.map((tipo) => {
        const list = grouped[tipo]
        if (list.length === 0) return null
        return (
          <div key={tipo}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {TIPO_LABELS[tipo]} ({list.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {list.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square border border-gray-200"
                >
                  <Image
                    src={asset.url}
                    alt={asset.descripcion ?? asset.tipo}
                    fill
                    className="object-contain p-2"
                    sizes="150px"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    {asset.descripcion && (
                      <p className="text-white text-xs line-clamp-2 mb-1">{asset.descripcion}</p>
                    )}
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {asset.tags.map((tag) => (
                          <span key={tag} className="bg-white/20 text-white text-xs px-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {isEditor && (
                      <button
                        onClick={() => handleDelete(asset)}
                        disabled={deleting === asset.id}
                        className="text-xs text-red-300 hover:text-red-100 font-medium mt-1"
                      >
                        {deleting === asset.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
