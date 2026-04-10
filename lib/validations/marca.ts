import { z } from 'zod'

export const tipografiaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  peso:   z.string().min(1, 'Peso requerido'),
  uso:    z.string().min(1, 'Uso requerido'),
})

export const colorPaletaSchema = z.object({
  primario:   z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  secundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  acento:     z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  neutro:     z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
})

export const marcaSchema = z.object({
  nombre:            z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  sector:            z.string().optional().nullable(),
  descripcion:       z.string().optional().nullable(),
  publico_objetivo:  z.string().optional().nullable(),
  colores:           colorPaletaSchema,
  tipografias:       z.array(tipografiaSchema).min(1, 'Agrega al menos una tipografía'),
  personalidad:      z.string().optional().nullable(),
  estilo_visual:     z.string().optional().nullable(),
  tono_visual:       z.string().optional().nullable(),
  tono_comunicacion: z.string().optional().nullable(),
  palabras_clave:    z.string().optional().nullable(),
  palabras_evitar:   z.string().optional().nullable(),
  referencias:       z.string().optional().nullable(),
  manual_marca_url:  z.string().url().optional().nullable(),
})

export type MarcaFormValues = z.infer<typeof marcaSchema>

export const assetMarcaSchema = z.object({
  tipo:        z.enum(['logo', 'fondo', 'icono', 'elemento', 'foto', 'efecto']),
  descripcion: z.string().optional(),
  tags:        z.string().optional(),
})

export type AssetFormValues = z.infer<typeof assetMarcaSchema>
