'use client'

import { useFormContext } from 'react-hook-form'
import type { CarruselFormValues } from '@/lib/validations/carrusel'

interface Props {
  index: number
  total: number
  onRemove: () => void
}

const POSICION_LABEL: Record<number, { label: string; hint: string; color: string }> = {
  0: { label: 'Hook', hint: 'Primer impacto visual — debe atrapar la atención inmediatamente', color: 'bg-purple-100 text-purple-700' },
  99: { label: 'CTA', hint: 'Llamada a la acción — cierre con contacto o acción específica', color: 'bg-green-100 text-green-700' },
}

export default function SlideInput({ index, total, onRemove }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CarruselFormValues>()

  const isHook = index === 0
  const isCta  = index === total - 1
  const pos    = isHook ? POSICION_LABEL[0] : isCta ? POSICION_LABEL[99] : null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {/* Header del slide */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-gray-100 rounded-full text-xs font-bold text-gray-600 flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          {pos && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pos.color}`}>
              {pos.label}
            </span>
          )}
        </div>
        {total > 3 && !isHook && !isCta && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Eliminar
          </button>
        )}
      </div>

      {pos && (
        <p className="text-xs text-gray-400 italic">{pos.hint}</p>
      )}

      {/* Copy */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Copy <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register(`slides.${index}.copy`)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder={
            isHook
              ? 'Ej: ¿Gastás dinero en Meta Ads sin ver resultados?'
              : isCta
              ? 'Ej: Escribinos al 📩 hola@agencia.com o DM directo'
              : 'Escribe el contenido de este slide...'
          }
        />
        {errors.slides?.[index]?.copy && (
          <p className="text-xs text-red-500 mt-1">{errors.slides[index].copy?.message}</p>
        )}
      </div>

      {/* Sugerencia visual (opcional) */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Sugerencia visual
          <span className="text-gray-400 font-normal ml-1">(opcional — la IA decide si no se indica)</span>
        </label>
        <input
          {...register(`slides.${index}.sugerencia_visual`)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ej: Foto de persona frustrada mirando pantalla, icono de Meta Ads, gráfico de ROI..."
        />
      </div>
    </div>
  )
}
