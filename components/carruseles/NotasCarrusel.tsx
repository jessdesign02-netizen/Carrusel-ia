'use client'

import { useState } from 'react'
import { actualizarNotas } from '@/app/(dashboard)/carruseles/actions'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  carruselId: string
  notasIniciales: string | null
}

export default function NotasCarrusel({ carruselId, notasIniciales }: Props) {
  const { addToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(notasIniciales ?? '')
  const [saving,  setSaving]  = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await actualizarNotas(carruselId, value)
    setSaving(false)
    if (result?.error) {
      addToast(result.error, 'error')
    } else {
      addToast('Notas guardadas')
      setEditing(false)
    }
  }

  function handleCancel() {
    setValue(notasIniciales ?? '')
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas internas</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {value ? 'Editar' : '+ Agregar nota'}
          </button>
        )}
      </div>

      {!editing ? (
        value ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{value}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Sin notas. Agrega comentarios internos para el equipo.</p>
        )
      ) : (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Comentarios internos, contexto, notas para el revisor..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
