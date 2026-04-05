import { z } from 'zod'

export const tipografiaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  peso: z.string().min(1, 'Peso requerido'),
  uso: z.string().min(1, 'Uso requerido'),
})

export const colorPaletaSchema = z.object({
  primario:   z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  secundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  acento:     z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  neutro:     z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
})

export const marcaSchema = z.object({
  nombre:      z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  colores:     colorPaletaSchema,
  tipografias: z.array(tipografiaSchema).min(1, 'Agrega al menos una tipografía'),
  tono_visual: z.string().optional(),
})

export type MarcaFormValues = z.infer<typeof marcaSchema>

export const assetMarcaSchema = z.object({
  tipo:        z.enum(['logo', 'fondo', 'icono', 'elemento', 'foto', 'efecto']),
  descripcion: z.string().optional(),
  tags:        z.string().optional(), // comma-separated, se parsea al guardar
})

export type AssetFormValues = z.infer<typeof assetMarcaSchema>
