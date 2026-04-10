'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarSlide } from '@/app/(dashboard)/carruseles/actions'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  slideId:          string
  carruselId:       string
  numero:           number
  copy:             string
  sugerenciaVisual: string | null
}

export default function SlideEditor({ slideId, carruselId, numero, copy, sugerenciaVisual }: Props) {
  const router     = useRouter()
  const { addToast } = useToast()
  const [editing,      setEditing]      = useState(false)
  const [copyVal,      setCopyVal]      = useState(copy)
  const [sugerencia,   setSugerencia]   = useState(sugerenciaVisual ?? '')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  function handleCancel() {
    setEditing(false)
    setCopyVal(copy)
    setSugerencia(sugerenciaVisual ?? '')
    setError(null)
  }

  async function handleSave() {
    if (!copyVal.trim()) return
    setSaving(true)
    setError(null)

    const result = await actualizarSlide(slideId, carruselId, {
      copy:             copyVal,
      sugerencia_visual: sugerencia.trim() || null,
    })

    if (result?.error) {
      setError(result.error)
      addToast(result.error, 'error')
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    addToast('Slide actualizado')
    router.refresh()
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full text-left text-xs border border-dashed border-gray-200 rounded-lg px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-gray-600 line-clamp-2 leading-relaxed">{copy}</p>
          <span className="text-indigo-400 group-hover:text-indigo-600 font-medium whitespace-nowrap flex-shrink-0 transition-colors">
            Editar
          </span>
        </div>
        {sugerenciaVisual && (
          <p className="text-gray-400 mt-1 italic line-clamp-1">Sugerencia: {sugerenciaVisual}</p>
        )}
      </button>
    )
  }

  return (
    <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/40 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-indigo-900">Slide {numero} — editando</p>
        <p className="text-xs text-amber-600 font-medium">La composición se limpiará al guardar</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Copy <span className="text-red-500">*</span>
        </label>
        <textarea
          value={copyVal}
          onChange={(e) => setCopyVal(e.target.value)}
          rows={3}
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Sugerencia visual{' '}
          <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={sugerencia}
          onChange={(e) => setSugerencia(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Ej: Foto de persona, icono de logo, gradiente oscuro..."
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !copyVal.trim()}
          className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
