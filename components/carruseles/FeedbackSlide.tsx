'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { guardarFeedbackSlide } from '@/app/(dashboard)/carruseles/actions'

interface Props {
  slideId:    string
  carruselId: string
  feedback:   string | null
  isRevisor:  boolean
}

export default function FeedbackSlide({ slideId, carruselId, feedback, isRevisor }: Props) {
  const router   = useRouter()
  const [editing, setEditing] = useState(false)
  const [text,    setText]    = useState(feedback ?? '')
  const [saving,  setSaving]  = useState(false)

  async function handleSave() {
    setSaving(true)
    await guardarFeedbackSlide(slideId, text, carruselId)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (!isRevisor && !feedback) return null

  if (!isRevisor && feedback) {
    return (
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
        <span className="font-medium">Feedback: </span>{feedback}
      </div>
    )
  }

  // Revisor
  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`w-full text-left text-xs rounded-lg px-2.5 py-2 border transition-colors ${
          feedback
            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            : 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-500'
        }`}
      >
        {feedback ? (
          <><span className="font-medium">Feedback: </span>{feedback}</>
        ) : (
          '+ Agregar feedback a este slide'
        )}
      </button>
    )
  }

  return (
    <div className="space-y-1.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        autoFocus
        className="w-full text-xs px-2.5 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        placeholder="Escribe el feedback para este slide..."
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={() => { setEditing(false); setText(feedback ?? '') }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
