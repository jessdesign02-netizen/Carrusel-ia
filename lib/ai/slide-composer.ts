import Anthropic from '@anthropic-ai/sdk'
import { buildCompositionPrompt, parseComposicion, posicionFromIndex } from './prompt-builder'
import type { Marca, AssetMarca, Slide, EnfoqueCarrusel, ComposicionSlide } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function componerSlide(params: {
  marca: Marca
  assets: AssetMarca[]
  slide: Slide
  index: number
  totalSlides: number
  enfoque: EnfoqueCarrusel
  imagenReferencia?: string | null
}): Promise<{ composicion: ComposicionSlide; promptUsado: string }> {
  const { marca, assets, slide, index, totalSlides, enfoque, imagenReferencia } = params

  const posicion = posicionFromIndex(index, totalSlides)
  const prompt = buildCompositionPrompt({
    marca,
    assets,
    copy: slide.copy,
    sugerenciaVisual: slide.sugerencia_visual,
    posicion,
    numeroSlide: index + 1,
    totalSlides,
    enfoque,
    imagenReferencia,
  })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const composicion = parseComposicion(responseText)

  if (!composicion) {
    // Fallback: composición básica si el parsing falla
    return {
      composicion: buildFallbackComposicion(slide, marca, posicion),
      promptUsado: prompt,
    }
  }

  return { composicion, promptUsado: prompt }
}

function buildFallbackComposicion(
  slide: Slide,
  marca: Marca,
  posicion: string
): ComposicionSlide {
  const layout =
    posicion === 'hook' ? 'hook' : posicion === 'cta' ? 'cta' : 'texto-centrado'

  return {
    layout: layout as ComposicionSlide['layout'],
    colorFondo:         marca.colores?.primario   ?? '#1e1e2e',
    colorTexto:         marca.colores?.secundario ?? '#ffffff',
    colorAcento:        marca.colores?.acento     ?? '#6366f1',
    tipografia:         marca.tipografias?.[0]?.nombre ?? 'Inter',
    textoTitular:       slide.copy.slice(0, 80),
    textoSecundario:    slide.copy.length > 80 ? slide.copy.slice(80) : null,
    assetFondoUrl:      null,
    assetElementoUrl:   null,
    imagenGeneradaUrl:  null,
    usarMascara:        false,
    generarImagen:      false,
    promptImagen:       null,
  }
}
