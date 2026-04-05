import { z } from 'zod'

export const slideInputSchema = z.object({
  copy:              z.string().min(1, 'El copy es requerido'),
  sugerencia_visual: z.string().optional(),
})

export const carruselSchema = z.object({
  marca_id:   z.string().uuid('Selecciona una marca'),
  enfoque:    z.enum(['educativo', 'promocional', 'storytelling', 'tendencia', 'otro']),
  slides: z
    .array(slideInputSchema)
    .min(3, 'Mínimo 3 slides')
    .max(7, 'Máximo 7 slides'),
})

export type CarruselFormValues = z.infer<typeof carruselSchema>
export type SlideInputValues = z.infer<typeof slideInputSchema>
