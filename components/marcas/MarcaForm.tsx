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
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(opt)
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
          }`}
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
    <div className="min-h-[42px] flex flex-wrap gap-1.5 items-center px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag).join(', '))} className="hover:text-red-500 leading-none">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
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
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'bg-gray-100 text-gray-400'}`}>
                {done ? '✓' : num}
              </span>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-indigo-700' : done ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <span className="text-gray-300 text-xs">→</span>}
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">¿Quién es la marca?</h2>
        <p className="text-sm text-gray-500">Cuéntanos los datos esenciales de identidad.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la marca <span className="text-red-500">*</span></label>
        <input {...register('nombre')} className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Nike, Saleads..." />
        {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sector / Industria</label>
        <ChipSelector
          options={SECTORES}
          selected={watch('sector') ? [watch('sector') as string] : []}
          onChange={(v) => setValue('sector', v[v.length - 1] ?? '')}
        />
        {watch('sector') === 'Otro' && (
          <input {...register('sector')} className="mt-2 w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe el sector..." />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué hace o propone esta marca?</label>
        <p className="text-xs text-gray-400 mb-2">Propósito, misión o valor que ofrece al mundo.</p>
        <textarea {...register('descripcion')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Ej: Ayudamos a emprendedores a escalar sus negocios digitales con estrategias claras y sistemas automatizados." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">¿A quién le habla? (Público objetivo)</label>
        <p className="text-xs text-gray-400 mb-2">Describe edad, perfil, intereses y estilo de vida de su audiencia.</p>
        <textarea {...register('publico_objetivo')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Ej: Mujeres de 28-42 años, emprendedoras en Latinoamérica, con negocio propio o en proceso de crearlo. Activas en Instagram, buscan crecimiento real y libertad financiera." />
      </div>

      <div className="flex justify-end pt-2">
        <button type="button" onClick={() => setStep(2)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
          Continuar →
        </button>
      </div>
    </form>
  )

  // ── Step 2: Visual ────────────────────────────────────────────
  if (step === 2) return (
    <form className="space-y-6">
      <StepIndicator current={2} />
      <div>
        <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 mb-3 block">← Identidad</button>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">¿Cómo se ve?</h2>
        <p className="text-sm text-gray-500">Identidad visual: colores, tipografías y estilo gráfico.</p>
      </div>

      {/* Paleta */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Paleta de colores <span className="text-red-500">*</span></h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(Object.keys(COLOR_LABELS) as Array<keyof typeof COLOR_LABELS>).map((key) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{COLOR_LABELS[key]}</label>
              <div className="flex items-center gap-2">
                <input type="color" {...register(`colores.${key}`)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5" />
                <input {...register(`colores.${key}`)} className="w-24 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="#000000" />
              </div>
              {errors.colores?.[key] && <p className="text-xs text-red-500 mt-1">{errors.colores[key]?.message}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Tipografías */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Tipografías <span className="text-red-500">*</span></h3>
          <button type="button" onClick={() => append({ nombre: '', peso: '', uso: '' })} className="text-xs text-indigo-600 hover:underline font-medium">+ Agregar</button>
        </div>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fuente</label>
                  <input {...register(`tipografias.${index}.nombre`)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Inter, Montserrat..." />
                  {errors.tipografias?.[index]?.nombre && <p className="text-xs text-red-500 mt-0.5">{errors.tipografias[index].nombre?.message}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Peso</label>
                  <input {...register(`tipografias.${index}.peso`)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="400, 700, Bold..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Uso</label>
                  <input {...register(`tipografias.${index}.uso`)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Títulos, Cuerpo..." />
                </div>
              </div>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="mt-5 text-gray-400 hover:text-red-500 text-sm">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Estilo visual */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Estilo visual (selecciona los que apliquen)</label>
        <ChipSelector options={ESTILOS} selected={estiloVisual} onChange={setEstiloVisual} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del estilo visual</label>
        <p className="text-xs text-gray-400 mb-2">¿Qué hace que esta marca se vea única? Describe texturas, formas, composición, referencias visuales...</p>
        <textarea {...register('tono_visual')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Ej: Fondos oscuros con detalles en dorado, tipografía serif elegante, fotografías de alto contraste, espacios en blanco generosos. Transmite lujo y exclusividad sin ser ostentoso." />
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300">← Atrás</button>
        <button type="button" onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">Continuar →</button>
      </div>
    </form>
  )

  // ── Step 3: Voz y personalidad ────────────────────────────────
  if (step === 3) return (
    <form className="space-y-6">
      <StepIndicator current={3} />
      <div>
        <button type="button" onClick={() => setStep(2)} className="text-xs text-gray-400 hover:text-gray-600 mb-3 block">← Visual</button>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">¿Cómo habla?</h2>
        <p className="text-sm text-gray-500">Personalidad, tono de comunicación y vocabulario de la marca.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Personalidad de la marca (selecciona los rasgos que la definen)</label>
        <ChipSelector options={PERSONALIDADES} selected={personalidad} onChange={setPersonalidad} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo habla con su audiencia?</label>
        <p className="text-xs text-gray-400 mb-2">Describe el tono, la actitud y la forma en que se comunica: formal/informal, inspiracional/práctico, directo/narrativo, etc.</p>
        <textarea {...register('tono_comunicacion')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Ej: Habla de tú a tú, con energía y sin rodeos. Usa lenguaje directo pero empático. No predica, acompaña. Celebra los logros pequeños y normaliza los tropiezos del camino emprendedor." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Palabras o conceptos que SÍ definen la marca</label>
        <p className="text-xs text-gray-400 mb-2">Escribe una palabra y presiona Enter o coma para agregarla.</p>
        <TagInput
          value={watch('palabras_clave') ?? ''}
          onChange={(v) => setValue('palabras_clave', v)}
          placeholder="innovación, crecimiento, comunidad..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Palabras, estilos o enfoques a EVITAR</label>
        <p className="text-xs text-gray-400 mb-2">¿Qué no quiere que se asocie con esta marca?</p>
        <TagInput
          value={watch('palabras_evitar') ?? ''}
          onChange={(v) => setValue('palabras_evitar', v)}
          placeholder="aburrido, genérico, corporativo..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Marcas de referencia o inspiración</label>
        <p className="text-xs text-gray-400 mb-2">¿De qué marcas toma elementos? Puedes indicar qué admira de cada una.</p>
        <input {...register('referencias')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Apple (minimalismo y claridad), Duolingo (tono cercano y divertido), HubSpot (contenido educativo)" />
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300">← Atrás</button>
        <button type="button" onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">Continuar →</button>
      </div>
    </form>
  )

  // ── Step 4: Documentos ────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <StepIndicator current={4} />
      <div>
        <button type="button" onClick={() => setStep(3)} className="text-xs text-gray-400 hover:text-gray-600 mb-3 block">← Voz</button>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Documentos y archivos</h2>
        <p className="text-sm text-gray-500">Sube el manual de marca o cualquier documento de referencia visual.</p>
      </div>

      {/* Manual de marca */}
      <div className="border border-gray-200 rounded-xl p-5 bg-white">
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Manual de marca <span className="text-gray-400 font-normal">(PDF o imagen)</span>
        </label>
        <p className="text-xs text-gray-400 mb-3">Si tienes un brandbook o guía de identidad, súbelo aquí. La IA lo tendrá como contexto de referencia.</p>

        {manualUrl ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <svg className="w-8 h-8 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 truncate">{manualNombre ?? 'Manual subido'}</p>
              <p className="text-xs text-green-600">✓ Archivo cargado correctamente</p>
            </div>
            <button type="button" onClick={() => { setManualUrl(null); setManualNombre(null); setValue('manual_marca_url', null) }} className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0">Quitar</button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${uploadingManual ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
            {uploadingManual ? (
              <>
                <span className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                <p className="text-sm text-indigo-600 font-medium">Subiendo archivo...</p>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">Haz clic para subir o arrastra aquí</p>
                <p className="text-xs text-gray-400">PDF, PNG, JPG — máx. 20MB</p>
              </>
            )}
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleManualUpload(f) }} />
          </label>
        )}
        {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="text-sm font-medium text-gray-700 mb-2">Resumen de la marca</p>
        {watch('nombre')           && <p>Nombre: <strong className="text-gray-900">{watch('nombre')}</strong></p>}
        {watch('sector')           && <p>Sector: <strong className="text-gray-900">{watch('sector')}</strong></p>}
        {personalidad.length > 0   && <p>Personalidad: <strong className="text-gray-900">{personalidad.join(', ')}</strong></p>}
        {estiloVisual.length > 0   && <p>Estilo visual: <strong className="text-gray-900">{estiloVisual.join(', ')}</strong></p>}
        {manualUrl                 && <p>Manual: <strong className="text-green-700">✓ adjunto</strong></p>}
      </div>

      {serverError && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{serverError}</p>}

      <div className="flex gap-3 justify-between pt-2">
        <button type="button" onClick={() => setStep(3)} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300">← Atrás</button>
        <div className="flex gap-3">
          <a href="/marcas" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 transition-colors">Cancelar</a>
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : marca ? 'Guardar cambios' : 'Crear marca'}
          </button>
        </div>
      </div>
    </form>
  )
}
