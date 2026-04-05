'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { marcaSchema, type MarcaFormValues } from '@/lib/validations/marca'
import { crearMarca, actualizarMarca } from '@/app/(dashboard)/marcas/actions'
import type { Marca } from '@/types'

interface Props {
  marca?: Marca
}

const colorLabels = {
  primario:   'Color primario',
  secundario: 'Color secundario',
  acento:     'Color de acento',
  neutro:     'Color neutro',
}

export default function MarcaForm({ marca }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MarcaFormValues>({
    resolver: zodResolver(marcaSchema),
    defaultValues: {
      nombre: marca?.nombre ?? '',
      colores: {
        primario:   marca?.colores?.primario   ?? '#6366f1',
        secundario: marca?.colores?.secundario ?? '#ffffff',
        acento:     marca?.colores?.acento     ?? '#f59e0b',
        neutro:     marca?.colores?.neutro     ?? '#f3f4f6',
      },
      tipografias: marca?.tipografias?.length
        ? marca.tipografias
        : [{ nombre: '', peso: '', uso: '' }],
      tono_visual: marca?.tono_visual ?? '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'tipografias' })

  async function onSubmit(values: MarcaFormValues) {
    setServerError(null)
    setSaving(true)
    try {
      if (marca) {
        const result = await actualizarMarca(marca.id, values)
        if (result?.error) setServerError(result.error)
      } else {
        const result = await crearMarca(values)
        if (result?.error) setServerError(result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la marca <span className="text-red-500">*</span>
        </label>
        <input
          {...register('nombre')}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ej: Nike, Coca-Cola..."
        />
        {errors.nombre && (
          <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>
        )}
      </div>

      {/* Paleta de colores */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Paleta de colores</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(Object.keys(colorLabels) as Array<keyof typeof colorLabels>).map((key) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 mb-1">{colorLabels[key]}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register(`colores.${key}`)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  {...register(`colores.${key}`)}
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="#000000"
                />
              </div>
              {errors.colores?.[key] && (
                <p className="text-xs text-red-500 mt-1">{errors.colores[key]?.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tipografías */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Tipografías</h3>
          <button
            type="button"
            onClick={() => append({ nombre: '', peso: '', uso: '' })}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            + Agregar tipografía
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fuente</label>
                  <input
                    {...register(`tipografias.${index}.nombre`)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Inter, Montserrat..."
                  />
                  {errors.tipografias?.[index]?.nombre && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.tipografias[index].nombre?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Peso</label>
                  <input
                    {...register(`tipografias.${index}.peso`)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="400, 700, Bold..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Uso</label>
                  <input
                    {...register(`tipografias.${index}.uso`)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Títulos, Cuerpo..."
                  />
                </div>
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-5 text-gray-400 hover:text-red-500 text-sm"
                  title="Eliminar"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.tipografias?.root && (
          <p className="text-xs text-red-500 mt-1">{errors.tipografias.root.message}</p>
        )}
      </div>

      {/* Tono visual */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tono visual
          <span className="text-gray-400 font-normal ml-1">(opcional)</span>
        </label>
        <textarea
          {...register('tono_visual')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Describe el estilo visual de la marca: minimalista, vibrante, corporativo, informal, etc."
        />
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{serverError}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Guardando...' : marca ? 'Guardar cambios' : 'Crear marca'}
        </button>
        <a
          href="/marcas"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
