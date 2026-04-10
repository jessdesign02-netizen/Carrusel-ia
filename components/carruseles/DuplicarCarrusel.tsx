'use client'

import { useState } from 'react'
import { duplicarCarrusel } from '@/app/(dashboard)/carruseles/actions'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  carruselId: string
}

export default function DuplicarCarrusel({ carruselId }: Props) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleDuplicar() {
    setLoading(true)
    setError(null)
    const result = await duplicarCarrusel(carruselId)
    if (result?.error) {
      setError(result.error)
      addToast(result.error, 'error')
      setLoading(false)
    }
    // Si no hay error, el server action hace redirect al nuevo carrusel
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDuplicar}
        disabled={loading}
        className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors disabled:opacity-50"
      >
        {loading ? 'Duplicando…' : 'Duplicar'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
