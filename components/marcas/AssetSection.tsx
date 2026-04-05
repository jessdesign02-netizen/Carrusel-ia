'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AssetUploader from './AssetUploader'
import AssetGallery from './AssetGallery'
import type { AssetMarca } from '@/types'

interface Props {
  marcaId: string
  initialAssets: AssetMarca[]
  isEditor: boolean
}

export default function AssetSection({ marcaId, initialAssets, isEditor }: Props) {
  const router = useRouter()
  const [showUploader, setShowUploader] = useState(false)

  function handleUploaded() {
    setShowUploader(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Assets de marca</h2>
        {isEditor && (
          <button
            onClick={() => setShowUploader((v) => !v)}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            {showUploader ? 'Cancelar' : '+ Subir asset'}
          </button>
        )}
      </div>

      {showUploader && isEditor && (
        <div className="mb-6">
          <AssetUploader marcaId={marcaId} onUploaded={handleUploaded} />
        </div>
      )}

      <AssetGallery assets={initialAssets} marcaId={marcaId} isEditor={isEditor} />
    </div>
  )
}
