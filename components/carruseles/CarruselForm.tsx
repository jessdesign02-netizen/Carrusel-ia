'use client'

import { useState } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { carruselSchema, type CarruselFormValues } from '@/lib/validations/carrusel'
import { crearCarrusel } from '@/app/(dashboard)/carruseles/actions'
import SlideInput from '@/components/slides/SlideInput'
import { createClient } from '@/lib/supabase/client'
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
  const [step, setStep]                     = useState<1 | 2 | 3>(1)
  const [serverError, setServerError]       = useState<string | null>(null)
  const [generating, setGenerating]         = useState(false)
  const [imagenUrl, setImagenUrl]           = useState<string | null>(null)
  const [imagenPreview, setImagenPreview]   = useState<string | null>(null)
  const [uploadingImg, setUploadingImg]     = useState(false)
  const [uploadError, setUploadError]       = useState<string | null>(null)

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

  async function handleImageUpload(file: File) {
    setUploadingImg(true)
    setUploadError(null)
    try {
      const preview = URL.createObjectURL(file)
      setImagenPreview(preview)

      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `referencia/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('assets-marca')
        .upload(path, file, { contentType: file.type, upsert: true })

      if (uploadErr) {
        setUploadError('Error al subir la imagen. Inténtalo de nuevo.')
        setImagenPreview(null)
        return
      }

      const { data } = supabase.storage.from('assets-marca').getPublicUrl(path)
      setImagenUrl(data.publicUrl)
      setValue('imagen_referencia', data.publicUrl)
    } catch {
      setUploadError('Error inesperado al subir la imagen.')
      setImagenPreview(null)
    } finally {
      setUploadingImg(false)
    }
  }

  async function onSubmit(values: CarruselFormValues) {
    setServerError(null)
    setGenerating(true)
    try {
      const result = await crearCarrusel({ ...values, imagen_referencia: imagenUrl })
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
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Selecciona la marca</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            La guía de marca se carga automáticamente para guiar la generación.
          </p>
        </div>

        {marcas.length === 0 ? (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(240,160,192,0.14)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.50)' }}>
            No hay marcas registradas. <a href="/marcas/nueva" className="font-medium underline">Crear una marca</a> primero.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {marcas.map((marca) => (
              <button
                key={marca.id}
                type="button"
                onClick={() => { setValue('marca_id', marca.id); setStep(2) }}
                className="card-glow card-glow-hover text-left p-4"
                style={marcaId === marca.id ? {
                  background: 'linear-gradient(135deg, rgba(253,216,122,0.30) 0%, rgba(184,168,212,0.25) 100%)',
                  border: '1.5px solid rgba(184,168,212,0.55)',
                } : {}}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-7 h-7 rounded-xl flex-shrink-0"
                    style={{
                      backgroundColor: marca.colores?.primario ?? '#6366f1',
                      boxShadow: `0 2px 8px ${marca.colores?.primario ?? '#6366f1'}55`,
                    }}
                  />
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{marca.nombre}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.values(marca.colores ?? {}).map((hex, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: hex as string, border: '1.5px solid rgba(255,255,255,0.60)' }}
                    />
                  ))}
                </div>
                {marca.tono_visual && (
                  <p className="text-xs mt-2 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{marca.tono_visual}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {errors.marca_id && (
          <p className="text-xs" style={{ color: 'var(--accent-negative)' }}>{errors.marca_id.message}</p>
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
          <button type="button" onClick={() => setStep(1)} className="text-xs mb-3 block" style={{ color: 'var(--text-muted)' }}>
            ← {marcaSeleccionada?.nombre}
          </button>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Enfoque del carrusel</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Define el propósito del contenido.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENFOQUES.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => { setValue('enfoque', e.value); setStep(3) }}
              className="card-glow card-glow-hover text-left p-4"
              style={enfoque === e.value ? {
                background: 'linear-gradient(135deg, rgba(253,216,122,0.30) 0%, rgba(184,168,212,0.25) 100%)',
                border: '1.5px solid rgba(184,168,212,0.55)',
              } : {}}
            >
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{e.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{e.desc}</p>
            </button>
          ))}
        </div>

        {errors.enfoque && (
          <p className="text-xs" style={{ color: 'var(--accent-negative)' }}>{errors.enfoque.message}</p>
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
          <button type="button" onClick={() => setStep(2)} className="text-xs mb-3 block" style={{ color: 'var(--text-muted)' }}>
            ← {enfoque && ENFOQUES.find(e => e.value === enfoque)?.label}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Contenido de slides</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Escribe el copy de cada slide. La IA genera la composición visual automáticamente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fields.length}/7 slides</span>
              {fields.length < 7 && (
                <button
                  type="button"
                  onClick={() => append(SLIDE_INICIAL)}
                  className="text-xs font-medium"
                  style={{ color: 'var(--accent-blue)' }}
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
          <p className="text-xs" style={{ color: 'var(--accent-negative)' }}>{errors.slides.root.message}</p>
        )}

        {/* Imagen de referencia */}
        <div className="card-glow p-4">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Imagen de referencia <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(opcional)</span>
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Adjunta una foto de la persona o el logo del cliente para que la IA lo use en las piezas.</p>

          {imagenPreview ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenPreview}
                alt="Referencia"
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                style={{ border: '1px solid rgba(180,210,240,0.42)' }}
              />
              <div className="flex-1 min-w-0">
                {uploadingImg ? (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--accent-blue)' }}>
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
                    Subiendo imagen…
                  </p>
                ) : imagenUrl ? (
                  <p className="text-xs font-medium" style={{ color: 'var(--accent-positive)' }}>✓ Imagen cargada correctamente</p>
                ) : null}
                {uploadError && <p className="text-xs mt-1" style={{ color: 'var(--accent-negative)' }}>{uploadError}</p>}
              </div>
              <button
                type="button"
                onClick={() => { setImagenPreview(null); setImagenUrl(null); setValue('imagen_referencia', null) }}
                className="text-xs flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <label
              className="flex items-center justify-center gap-2 p-4 cursor-pointer rounded-2xl transition-all"
              style={{
                border: `2px dashed ${uploadingImg ? 'rgba(122,184,245,0.50)' : 'rgba(255,255,255,0.50)'}`,
                background: uploadingImg ? 'rgba(122,184,245,0.08)' : 'rgba(255,255,255,0.20)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subir foto o logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
            </label>
          )}
        </div>

        {/* Resumen */}
        <div className="card-glow p-4">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Resumen</p>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Marca: <strong style={{ color: 'var(--text-primary)' }}>{marcaSeleccionada?.nombre}</strong></span>
            <span>Enfoque: <strong className="capitalize" style={{ color: 'var(--text-primary)' }}>{enfoque}</strong></span>
            <span>Slides: <strong style={{ color: 'var(--text-primary)' }}>{fields.length}</strong></span>
            {imagenUrl && <span>Imagen: <strong style={{ color: 'rgba(30,100,65,0.80)' }}>✓ adjunta</strong></span>}
          </div>
        </div>

        {serverError && (
          <p className="text-sm px-4 py-3 rounded-2xl" style={{ color: 'rgba(160,50,50,0.85)', background: 'rgba(255,200,200,0.30)', border: '1px solid rgba(255,180,180,0.40)' }}>{serverError}</p>
        )}

        <button
          type="submit"
          disabled={generating}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          style={generating ? { opacity: 0.7 } : {}}
        >
          {generating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
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
            <div className="flex items-center gap-1.5">
              <span
                className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                style={done
                  ? { background: 'rgba(122,184,245,0.30)', color: 'var(--accent-blue)', border: '1px solid rgba(122,184,245,0.50)' }
                  : active
                    ? { background: 'rgba(122,184,245,0.18)', color: 'var(--accent-blue)', border: '2px solid rgba(122,184,245,0.55)' }
                    : { background: 'rgba(255,255,255,0.25)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.45)' }
                }
              >
                {done ? '✓' : num}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: active ? 'var(--accent-blue)' : done ? 'var(--text-secondary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="text-xs mx-1" style={{ color: 'var(--text-muted)' }}>→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
