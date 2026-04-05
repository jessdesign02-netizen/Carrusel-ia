'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TipoAsset } from '@/types'

interface Props {
  marcaId: string
  onUploaded: () => void
}

const TIPOS: { value: TipoAsset; label: string; hint: string }[] = [
  { value: 'logo',     label: 'Logo',     hint: 'Logo principal o versiones' },
  { value: 'fondo',    label: 'Fondo',    hint: 'Fondos y texturas' },
  { value: 'icono',    label: 'Icono',    hint: 'Iconos y símbolos' },
  { value: 'elemento', label: 'Elemento', hint: 'Elementos gráficos decorativos' },
  { value: 'foto',     label: 'Foto',     hint: 'Fotografías de producto o lifestyle' },
  { value: 'efecto',   label: 'Efecto',   hint: 'Efectos, overlays, filtros' },
]

const ACCEPTED = 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif'

export default function AssetUploader({ marcaId, onUploaded }: Props) {
  const [tipo, setTipo] = useState<TipoAsset>('logo')
  const [descripcion, setDescripcion] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `${marcaId}/${tipo}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('assets-marca')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('assets-marca')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase.from('assets_marca').insert({
        marca_id:    marcaId,
        tipo,
        url:         urlData.publicUrl,
        descripcion: descripcion.trim() || null,
        tags:        tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
      })

      if (dbError) throw dbError

      setDescripcion('')
      setTags('')
      onUploaded()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Subir asset</h3>

      {/* Tipo de asset */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Tipo de asset</label>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              title={t.hint}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                tipo === t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Descripción <span className="text-gray-400">(para contexto de IA)</span>
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ej: Logo blanco para fondos oscuros"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Tags <span className="text-gray-400">(separados por coma)</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="blanco, oscuro, horizontal"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-sm text-indigo-600 font-medium">Subiendo...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Arrastra un archivo o <span className="text-indigo-600 font-medium">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, SVG · Máx. 10MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  )
}
