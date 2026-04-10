'use client'

import { useState, KeyboardEvent } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { marcaSchema, type MarcaFormValues } from '@/lib/validations/marca'
import { crearMarca, actualizarMarca } from '@/app/(dashboard)/marcas/actions'
import { createClient } from '@/lib/supabase/client'
import type { Marca } from '@/types'

interface Props { marca?: Marca }

const SECTORES = ['Marketing / Publicidad', 'Salud / Bienestar', 'Moda / Lifestyle', 'Tecnología', 'Alimentación / Bebidas', 'Educación', 'Finanzas', 'Inmobiliaria', 'Deporte / Fitness', 'Arte / Diseño', 'Otro']
const PERSONALIDADES = ['Profesional', 'Cercano', 'Inspiracional', 'Divertido', 'Elegante', 'Moderno', 'Tradicional', 'Audaz', 'Premium', 'Minimalista']
const ESTILOS = ['Minimalista', 'Vibrante', 'Corporativo', 'Orgánico / Natural', 'Futurista / Tech', 'Artesanal', 'Lujoso / Premium', 'Juvenil / Energético', 'Sobrio / Clásico', 'Editorial']

const COLOR_LABELS = { primario: 'Primario', secundario: 'Secundario', acento: 'Acento', neutro: 'Neutro' }

function splitChips(val: string | null | undefined): string[] {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

function ChipSelector({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={selected.includes(opt) ? 'chip-glow chip-glow-active' : 'chip-glow'}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function TagInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [input, setInput] = useState('')
  const tags = splitChips(value)

  function addTag() {
    const trimmed = input.trim().replace(/,$/, '')
    if (!trimmed || tags.includes(trimmed)) { setInput(''); return }
    onChange([...tags, trimmed].join(', '))
    setInput('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1).join(', '))
    }
  }

  return (
    <div className="min-h-[42px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-2xl" style={{
      background: 'rgba(255,255,255,0.50)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(180,210,240,0.42)',
    }}>
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{
          background: 'rgba(184,168,212,0.30)',
          color: 'rgba(90,55,120,0.85)',
          border: '1px solid rgba(184,168,212,0.40)',
        }}>
          {tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag).join(', '))} className="leading-none" style={{ color: 'rgba(90,55,120,0.55)' }}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  )
}

function StepIndicator({ current }: { current: number }) {
  const steps = ['Identidad', 'Visual', 'Voz', 'Documentos']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                style={done
                  ? { background: 'linear-gradient(135deg, var(--glow-core), var(--lavender))', color: 'rgba(75,45,110,0.95)' }
                  : active
                    ? { background: 'rgba(184,168,212,0.30)', color: 'rgba(90,55,120,0.90)', border: '2px solid rgba(184,168,212,0.70)' }
                    : { background: 'rgba(255,255,255,0.40)', color: 'var(--text-muted)', border: '1px solid rgba(180,210,240,0.35)' }
                }
              >
                {done ? '✓' : num}
              </span>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: active ? 'rgba(90,55,120,0.90)' : done ? 'var(--text-secondary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function MarcaForm({ marca }: Props) {
  const [step, setStep]                   = useState(1)
  const [serverError, setServerError]     = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)
  const [personalidad, setPersonalidad]   = useState<string[]>(splitChips(marca?.personalidad))
  const [estiloVisual, setEstiloVisual]   = useState<string[]>(splitChips(marca?.estilo_visual))
  const [manualUrl, setManualUrl]         = useState<string | null>(marca?.manual_marca_url ?? null)
  const [manualNombre, setManualNombre]   = useState<string | null>(null)
  const [uploadingManual, setUploadingManual] = useState(false)
  const [uploadError, setUploadError]     = useState<string | null>(null)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<MarcaFormValues>({
    resolver: zodResolver(marcaSchema),
    defaultValues: {
      nombre:            marca?.nombre            ?? '',
      sector:            marca?.sector            ?? '',
      descripcion:       marca?.descripcion       ?? '',
      publico_objetivo:  marca?.publico_objetivo  ?? '',
      colores: {
        primario:   marca?.colores?.primario   ?? '#6366f1',
        secundario: marca?.colores?.secundario ?? '#ffffff',
        acento:     marca?.colores?.acento     ?? '#f59e0b',
        neutro:     marca?.colores?.neutro     ?? '#f3f4f6',
      },
      tipografias:       marca?.tipografias?.length ? marca.tipografias : [{ nombre: '', peso: '', uso: '' }],
      tono_visual:       marca?.tono_visual       ?? '',
      tono_comunicacion: marca?.tono_comunicacion ?? '',
      palabras_clave:    marca?.palabras_clave    ?? '',
      palabras_evitar:   marca?.palabras_evitar   ?? '',
      referencias:       marca?.referencias       ?? '',
      manual_marca_url:  marca?.manual_marca_url  ?? null,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'tipografias' })

  async function handleManualUpload(file: File) {
    setUploadingManual(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'pdf'
      const path = `manuales/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('assets-marca').upload(path, file, { contentType: file.type, upsert: true })
      if (uploadErr) { setUploadError('Error al subir el archivo.'); return }
      const { data } = supabase.storage.from('assets-marca').getPublicUrl(path)
      setManualUrl(data.publicUrl)
      setManualNombre(file.name)
      setValue('manual_marca_url', data.publicUrl)
    } catch {
      setUploadError('Error inesperado al subir el archivo.')
    } finally {
      setUploadingManual(false)
    }
  }

  async function onSubmit(values: MarcaFormValues) {
    setServerError(null)
    setSaving(true)
    const payload: MarcaFormValues = {
      ...values,
      personalidad:     personalidad.join(', ') || null,
      estilo_visual:    estiloVisual.join(', ')  || null,
      manual_marca_url: manualUrl,
    }
    try {
      if (marca) {
        const result = await actualizarMarca(marca.id, payload)
        if (result?.error) setServerError(result.error)
      } else {
        const result = await crearMarca(payload)
        if (result?.error) setServerError(result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Step 1: Identidad ─────────────────────────────────────────
  if (step === 1) return (
    <form className="space-y-6">
      <StepIndicator current={1} />
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>¿Quién es la marca?</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cuéntanos los datos esenciales de identidad.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Nombre de la marca <span style={{ color: 'rgba(200,80,80,0.75)' }}>*</span>
        </label>
        <input {...register('nombre')} className="input-glow w-full max-w-sm" placeholder="Ej: Nike, Saleads..." />
        {errors.nombre && <p className="text-xs mt-1" style={{ color: 'rgba(180,60,60,0.80)' }}>{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Sector / Industria</label>
        <ChipSelector
          options={SECTORES}
          selected={watch('sector') ? [watch('sector') as string] : []}
          onChange={(v) => setValue('sector', v[v.length - 1] ?? '')}
        />
        {watch('sector') === 'Otro' && (
          <input {...register('sector')} className="input-glow mt-2 w-full max-w-xs" placeholder="Describe el sector..." />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>¿Qué hace o propone esta marca?</label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Propósito, misión o valor que ofrece al mundo.</p>
        <textarea {...register('descripcion')} rows={3} className="input-glow w-full resize-none" placeholder="Ej: Ayudamos a emprendedores a escalar sus negocios digitales con estrategias claras y sistemas automatizados." />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>¿A quién le habla? (Público objetivo)</label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Describe edad, perfil, intereses y estilo de vida de su audiencia.</p>
        <textarea {...register('publico_objetivo')} rows={3} className="input-glow w-full resize-none" placeholder="Ej: Mujeres de 28-42 años, emprendedoras en Latinoamérica, con negocio propio o en proceso de crearlo." />
      </div>

      <div className="flex justify-end pt-2">
        <button type="button" onClick={() => setStep(2)} className="btn-primary">Continuar →</button>
      </div>
    </form>
  )

  // ── Step 2: Visual ────────────────────────────────────────────
  if (step === 2) return (
    <form className="space-y-6">
      <StepIndicator current={2} />
      <div>
        <button type="button" onClick={() => setStep(1)} className="text-xs mb-3 block" style={{ color: 'var(--text-muted)' }}>← Identidad</button>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>¿Cómo se ve?</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Identidad visual: colores, tipografías y estilo gráfico.</p>
      </div>

      {/* Paleta */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Paleta de colores <span style={{ color: 'rgba(200,80,80,0.75)' }}>*</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(Object.keys(COLOR_LABELS) as Array<keyof typeof COLOR_LABELS>).map((key) => (
            <div key={key}>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{COLOR_LABELS[key]}</label>
              <div className="flex items-center gap-2">
                <input type="color" {...register(`colores.${key}`)} className="w-10 h-10 rounded-xl cursor-pointer p-0.5" style={{ border: '1px solid rgba(180,210,240,0.42)', background: 'rgba(255,255,255,0.50)' }} />
                <input {...register(`colores.${key}`)} className="input-glow w-24 font-mono text-xs" placeholder="#000000" />
              </div>
              {errors.colores?.[key] && <p className="text-xs mt-1" style={{ color: 'rgba(180,60,60,0.80)' }}>{errors.colores[key]?.message}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Tipografías */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tipografías <span style={{ color: 'rgba(200,80,80,0.75)' }}>*</span>
          </h3>
          <button type="button" onClick={() => append({ nombre: '', peso: '', uso: '' })} className="text-xs font-medium" style={{ color: 'rgba(130,80,180,0.80)' }}>+ Agregar</button>
        </div>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="card-glow flex gap-3 items-start p-3">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Fuente</label>
                  <input {...register(`tipografias.${index}.nombre`)} className="input-glow w-full" placeholder="Inter, Montserrat..." />
                  {errors.tipografias?.[index]?.nombre && <p className="text-xs mt-0.5" style={{ color: 'rgba(180,60,60,0.80)' }}>{errors.tipografias[index].nombre?.message}</p>}
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Peso</label>
                  <input {...register(`tipografias.${index}.peso`)} className="input-glow w-full" placeholder="400, 700, Bold..." />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Uso</label>
                  <input {...register(`tipografias.${index}.uso`)} className="input-glow w-full" placeholder="Títulos, Cuerpo..." />
                </div>
              </div>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="mt-5 text-sm" style={{ color: 'var(--text-muted)' }}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Estilo visual */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Estilo visual (selecciona los que apliquen)</label>
        <ChipSelector options={ESTILOS} selected={estiloVisual} onChange={setEstiloVisual} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Descripción del estilo visual</label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>¿Qué hace que esta marca se vea única? Describe texturas, formas, composición, referencias visuales...</p>
        <textarea {...register('tono_visual')} rows={3} className="input-glow w-full resize-none" placeholder="Ej: Fondos oscuros con detalles en dorado, tipografía serif elegante, fotografías de alto contraste." />
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Atrás</button>
        <button type="button" onClick={() => setStep(3)} className="btn-primary">Continuar →</button>
      </div>
    </form>
  )

  // ── Step 3: Voz y personalidad ────────────────────────────────
  if (step === 3) return (
    <form className="space-y-6">
      <StepIndicator current={3} />
      <div>
        <button type="button" onClick={() => setStep(2)} className="text-xs mb-3 block" style={{ color: 'var(--text-muted)' }}>← Visual</button>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>¿Cómo habla?</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Personalidad, tono de comunicación y vocabulario de la marca.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Personalidad de la marca (selecciona los rasgos que la definen)</label>
        <ChipSelector options={PERSONALIDADES} selected={personalidad} onChange={setPersonalidad} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>¿Cómo habla con su audiencia?</label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Describe el tono, la actitud y la forma en que se comunica: formal/informal, inspiracional/práctico, directo/narrativo, etc.</p>
        <textarea {...register('tono_comunicacion')} rows={3} className="input-glow w-full resize-none" placeholder="Ej: Habla de tú a tú, con energía y sin rodeos. Usa lenguaje directo pero empático." />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Palabras o conceptos que SÍ definen la marca</label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Escribe una palabra y presiona Enter o coma para agregarla.</p>
        <TagInput
          value={watch('palabras_clave') ?? ''}
          onChange={(v) => setValue('palabras_clave', v)}
          placeholder="innovación, crecimiento, comunidad..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Palabras, estilos o enfoques a EVITAR</label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>¿Qué no quiere que se asocie con esta marca?</p>
        <TagInput
          value={watch('palabras_evitar') ?? ''}
          onChange={(v) => setValue('palabras_evitar', v)}
          placeholder="aburrido, genérico, corporativo..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Marcas de referencia o inspiración</label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>¿De qué marcas toma elementos? Puedes indicar qué admira de cada una.</p>
        <input {...register('referencias')} className="input-glow w-full" placeholder="Ej: Apple (minimalismo y claridad), Duolingo (tono cercano y divertido)" />
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={() => setStep(2)} className="btn-secondary">← Atrás</button>
        <button type="button" onClick={() => setStep(4)} className="btn-primary">Continuar →</button>
      </div>
    </form>
  )

  // ── Step 4: Documentos ────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <StepIndicator current={4} />
      <div>
        <button type="button" onClick={() => setStep(3)} className="text-xs mb-3 block" style={{ color: 'var(--text-muted)' }}>← Voz</button>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Documentos y archivos</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sube el manual de marca o cualquier documento de referencia visual.</p>
      </div>

      {/* Manual de marca */}
      <div className="card-glow p-5">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Manual de marca <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(PDF o imagen)</span>
        </label>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Si tienes un brandbook o guía de identidad, súbelo aquí. La IA lo tendrá como contexto de referencia.</p>

        {manualUrl ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(168,216,196,0.20)', border: '1px solid rgba(168,216,196,0.40)' }}>
            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'rgba(30,100,65,0.70)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'rgba(30,100,65,0.85)' }}>{manualNombre ?? 'Manual subido'}</p>
              <p className="text-xs" style={{ color: 'rgba(30,100,65,0.65)' }}>✓ Archivo cargado correctamente</p>
            </div>
            <button type="button" onClick={() => { setManualUrl(null); setManualNombre(null); setValue('manual_marca_url', null) }} className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Quitar</button>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-2 p-8 cursor-pointer rounded-2xl transition-all"
            style={{
              border: `2px dashed ${uploadingManual ? 'rgba(184,168,212,0.60)' : 'rgba(180,210,240,0.50)'}`,
              background: uploadingManual ? 'rgba(184,168,212,0.10)' : 'rgba(255,255,255,0.25)',
            }}
          >
            {uploadingManual ? (
              <>
                <span className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'rgba(130,80,180,0.70)', borderTopColor: 'transparent' }} />
                <p className="text-sm font-medium" style={{ color: 'rgba(90,55,120,0.80)' }}>Subiendo archivo...</p>
              </>
            ) : (
              <>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Haz clic para subir o arrastra aquí</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF, PNG, JPG — máx. 20MB</p>
              </>
            )}
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleManualUpload(f) }} />
          </label>
        )}
        {uploadError && <p className="text-xs mt-2" style={{ color: 'rgba(180,60,60,0.80)' }}>{uploadError}</p>}
      </div>

      {/* Resumen */}
      <div className="card-glow p-4">
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Resumen de la marca</p>
        <div className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {watch('nombre')           && <p>Nombre: <strong style={{ color: 'var(--text-primary)' }}>{watch('nombre')}</strong></p>}
          {watch('sector')           && <p>Sector: <strong style={{ color: 'var(--text-primary)' }}>{watch('sector')}</strong></p>}
          {personalidad.length > 0   && <p>Personalidad: <strong style={{ color: 'var(--text-primary)' }}>{personalidad.join(', ')}</strong></p>}
          {estiloVisual.length > 0   && <p>Estilo visual: <strong style={{ color: 'var(--text-primary)' }}>{estiloVisual.join(', ')}</strong></p>}
          {manualUrl                 && <p>Manual: <strong style={{ color: 'rgba(30,100,65,0.80)' }}>✓ adjunto</strong></p>}
        </div>
      </div>

      {serverError && (
        <p className="text-sm px-4 py-3 rounded-2xl" style={{ color: 'rgba(160,50,50,0.85)', background: 'rgba(255,200,200,0.30)', border: '1px solid rgba(255,180,180,0.40)' }}>{serverError}</p>
      )}

      <div className="flex gap-3 justify-between pt-2">
        <button type="button" onClick={() => setStep(3)} className="btn-secondary">← Atrás</button>
        <div className="flex gap-3">
          <a href="/marcas" className="btn-secondary">Cancelar</a>
          <button type="submit" disabled={saving} className="btn-primary" style={saving ? { opacity: 0.6 } : {}}>
            {saving ? 'Guardando...' : marca ? 'Guardar cambios' : 'Crear marca'}
          </button>
        </div>
      </div>
    </form>
  )
}
