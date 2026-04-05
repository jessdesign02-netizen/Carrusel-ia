'use client'

import { useState } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { carruselSchema, type CarruselFormValues } from '@/lib/validations/carrusel'
import { crearCarrusel } from '@/app/(dashboard)/carruseles/actions'
import SlideInput from '@/components/slides/SlideInput'
import type { Marca } from '@/types'

interface Props {
  marcas: Marca[]
}

const ENFOQUES: { value: CarruselFormValues['enfoque']; label: string; desc: string }[] = [
  { value: 'educativo',    label: 'Educativo',    desc: 'Enseña, explica o informa' },
  { value: 'promocional',  label: 'Promocional',  desc: 'Presenta un servicio o producto' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Cuenta una historia o caso de éxito' },
  { value: 'tendencia',    label: 'Tendencia',    desc: 'Aprovecha un tema de actualidad' },
  { value: 'otro',         label: 'Otro',         desc: 'Enfoque libre' },
]

const SLIDE_INICIAL = { copy: '', sugerencia_visual: '' }

export default function CarruselForm({ marcas }: Props) {
  const [step, setStep]         = useState<1 | 2 | 3>(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [generating, setGenerating]   = useState(false)

  const methods = useForm<CarruselFormValues>({
    resolver: zodResolver(carruselSchema),
    defaultValues: {
      marca_id: '',
      enfoque:  undefined,
      slides:   [
        SLIDE_INICIAL,
        SLIDE_INICIAL,
        SLIDE_INICIAL,
        SLIDE_INICIAL,
        SLIDE_INICIAL,
      ],
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods

  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'slides' })

  const marcaId = watch('marca_id')
  const enfoque = watch('enfoque')
  const marcaSeleccionada = marcas.find((m) => m.id === marcaId)

  async function onSubmit(values: CarruselFormValues) {
    setServerError(null)
    setGenerating(true)
    try {
      const result = await crearCarrusel(values)
      if (result?.error) {
        setServerError(result.error)
        setGenerating(false)
      }
      // Si no hay error, crearCarrusel hace redirect a /carruseles/[id]
    } catch {
      setServerError('Error inesperado. Inténtalo de nuevo.')
      setGenerating(false)
    }
  }

  // ── Step 1: Marca ──────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="max-w-2xl space-y-6">
        <StepIndicator current={1} />

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Selecciona la marca</h2>
          <p className="text-sm text-gray-500">
            La guía de marca se carga automáticamente para guiar la generación.
          </p>
        </div>

        {marcas.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            No hay marcas registradas. <a href="/marcas/nueva" className="font-medium underline">Crear una marca</a> primero.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {marcas.map((marca) => (
              <button
                key={marca.id}
                type="button"
                onClick={() => { setValue('marca_id', marca.id); setStep(2) }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  marcaId === marca.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0"
                    style={{ backgroundColor: marca.colores?.primario ?? '#6366f1' }}
                  />
                  <span className="font-medium text-gray-900 text-sm">{marca.nombre}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.values(marca.colores ?? {}).map((hex, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: hex as string }}
                    />
                  ))}
                </div>
                {marca.tono_visual && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-1">{marca.tono_visual}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {errors.marca_id && (
          <p className="text-xs text-red-500">{errors.marca_id.message}</p>
        )}
      </div>
    )
  }

  // ── Step 2: Enfoque ────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="max-w-2xl space-y-6">
        <StepIndicator current={2} />

        <div>
          <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 mb-3">
            ← {marcaSeleccionada?.nombre}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Enfoque del carrusel</h2>
          <p className="text-sm text-gray-500">Define el propósito del contenido.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENFOQUES.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => { setValue('enfoque', e.value); setStep(3) }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                enfoque === e.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 bg-white'
              }`}
            >
              <p className="font-medium text-gray-900 text-sm">{e.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{e.desc}</p>
            </button>
          ))}
        </div>

        {errors.enfoque && (
          <p className="text-xs text-red-500">{errors.enfoque.message}</p>
        )}
      </div>
    )
  }

  // ── Step 3: Slides ─────────────────────────────────────────
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <StepIndicator current={3} />

        <div>
          <button type="button" onClick={() => setStep(2)} className="text-xs text-gray-400 hover:text-gray-600 mb-3">
            ← {enfoque && ENFOQUES.find(e => e.value === enfoque)?.label}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Contenido de slides</h2>
              <p className="text-sm text-gray-500">
                Escribe el copy de cada slide. La IA genera la composición visual automáticamente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{fields.length}/7 slides</span>
              {fields.length < 7 && (
                <button
                  type="button"
                  onClick={() => append(SLIDE_INICIAL)}
                  className="text-xs text-indigo-600 font-medium hover:underline"
                >
                  + Agregar slide
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de slides */}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <SlideInput
              key={field.id}
              index={index}
              total={fields.length}
              onRemove={() => remove(index)}
            />
          ))}
        </div>

        {errors.slides?.root && (
          <p className="text-xs text-red-500">{errors.slides.root.message}</p>
        )}

        {/* Resumen */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm border border-gray-200">
          <p className="font-medium text-gray-700 mb-1">Resumen</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>Marca: <strong className="text-gray-900">{marcaSeleccionada?.nombre}</strong></span>
            <span>Enfoque: <strong className="text-gray-900 capitalize">{enfoque}</strong></span>
            <span>Slides: <strong className="text-gray-900">{fields.length}</strong></span>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={generating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Guardando carrusel...
            </>
          ) : (
            'Generar carrusel con IA'
          )}
        </button>
      </form>
    </FormProvider>
  )
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Marca', 'Enfoque', 'Contenido']
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5`}>
              <span
                className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                  done   ? 'bg-indigo-600 text-white' :
                  active ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' :
                           'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : num}
              </span>
              <span className={`text-xs font-medium ${active ? 'text-indigo-700' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="text-gray-300 text-xs mx-1">→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
