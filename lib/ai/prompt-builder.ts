import type { Marca, AssetMarca, EnfoqueCarrusel, PosicionSlide, ComposicionSlide } from '@/types'

interface BuildPromptParams {
  marca: Marca
  assets: AssetMarca[]
  copy: string
  sugerenciaVisual: string | null
  posicion: PosicionSlide
  numeroSlide: number
  totalSlides: number
  enfoque: EnfoqueCarrusel
  imagenReferencia?: string | null
}

export function buildCompositionPrompt(params: BuildPromptParams): string {
  const { marca, assets, copy, sugerenciaVisual, posicion, numeroSlide, totalSlides, enfoque, imagenReferencia } = params

  const assetsPorTipo = assets.reduce<Record<string, string[]>>((acc, a) => {
    if (!acc[a.tipo]) acc[a.tipo] = []
    const desc = a.descripcion ? ` (${a.descripcion})` : ''
    const tags = a.tags?.length ? ` [tags: ${a.tags.join(', ')}]` : ''
    acc[a.tipo].push(`URL: ${a.url}${desc}${tags}`)
    return acc
  }, {})

  const assetsText = Object.entries(assetsPorTipo)
    .map(([tipo, list]) => `  ${tipo.toUpperCase()}:\n${list.map(u => `    - ${u}`).join('\n')}`)
    .join('\n') || '  (sin assets disponibles)'

  const tipografiasText = (marca.tipografias ?? [])
    .map(t => `  - ${t.nombre} peso ${t.peso} → uso: ${t.uso}`)
    .join('\n') || '  - Inter 400 (fallback)'

  const posicionHint =
    posicion === 'hook'
      ? 'HOOK: primer slide. Impacto máximo. Texto grande, alto contraste, elemento visual dominante. Debe atrapar la atención en 1 segundo.'
      : posicion === 'cta'
      ? 'CTA: último slide. Llamada a la acción clara. Mostrar datos de contacto o acción específica del copy. Diseño limpio y memorable.'
      : `Slide ${numeroSlide} de ${totalSlides}. Contenido de desarrollo. Jerarquía clara texto titular + secundario.`

  const identidadExtra = [
    marca.sector            && `Sector: ${marca.sector}`,
    marca.descripcion       && `Propósito de marca: ${marca.descripcion}`,
    marca.publico_objetivo  && `Público objetivo: ${marca.publico_objetivo}`,
    marca.personalidad      && `Personalidad: ${marca.personalidad}`,
    marca.estilo_visual     && `Estilo visual: ${marca.estilo_visual}`,
    marca.tono_comunicacion && `Tono de comunicación: ${marca.tono_comunicacion}`,
    marca.palabras_clave    && `Palabras que definen la marca: ${marca.palabras_clave}`,
    marca.palabras_evitar   && `Palabras/estilos a EVITAR: ${marca.palabras_evitar}`,
    marca.referencias       && `Marcas de referencia/inspiración: ${marca.referencias}`,
  ].filter(Boolean).join('\n')

  return `Eres un director de arte especialista en redes sociales. Debes diseñar la composición visual de un slide para un carrusel de Instagram.

## GUÍA DE MARCA: ${marca.nombre}

**Identidad de marca**:
${identidadExtra || '  (sin información adicional)'}

**Paleta de colores** (USA SOLO ESTOS):
- Primario:   ${marca.colores?.primario ?? '#000000'}
- Secundario: ${marca.colores?.secundario ?? '#ffffff'}
- Acento:     ${marca.colores?.acento ?? '#6366f1'}
- Neutro:     ${marca.colores?.neutro ?? '#f3f4f6'}

**Tipografías disponibles**:
${tipografiasText}

**Tono visual**: ${marca.tono_visual ?? 'No especificado'}

**Assets disponibles**:
${assetsText}

## DATOS DEL SLIDE

**Copy del slide**: "${copy}"
${sugerenciaVisual ? `**Sugerencia visual del diseñador**: ${sugerenciaVisual}` : '**Sugerencia visual**: ninguna — decide tú basándote en el copy y la marca'}
${imagenReferencia ? `**IMAGEN DE REFERENCIA DEL CLIENTE** (foto de persona o logo adjuntado): ${imagenReferencia}
→ USA esta imagen como assetElementoUrl o assetFondoUrl según corresponda al layout. NO generes una imagen nueva si tienes esta referencia disponible. Intégrala de forma orgánica en la composición.` : ''}
**Posición**: ${posicionHint}
**Enfoque del carrusel**: ${enfoque}

## REGLAS OBLIGATORIAS

1. colorFondo, colorTexto y colorAcento DEBEN ser de la paleta de la marca
2. tipografia DEBE ser una de las fuentes listadas (solo el nombre, ej: "Inter")
3. textoTitular es la frase principal del copy (puede ser reformulada creativamente)
4. Si el copy menciona una plataforma, marca o concepto reconocible (Meta, Instagram, Google, etc.), incorporar elementos alusivos en el promptImagen
5. Las imágenes deben integrarse de forma orgánica, nunca como un rectángulo pegado
6. Si hay una IMAGEN DE REFERENCIA DEL CLIENTE, úsala SIEMPRE como assetElementoUrl o assetFondoUrl — tiene prioridad sobre cualquier asset y sobre generar imagen nueva

## RESPUESTA REQUERIDA

Responde ÚNICAMENTE con un objeto JSON válido sin comentarios, con esta estructura exacta:

{
  "layout": "hook" | "texto-imagen" | "imagen-texto" | "texto-centrado" | "cta",
  "colorFondo": "#hexcode",
  "colorTexto": "#hexcode",
  "colorAcento": "#hexcode",
  "tipografia": "NombreFuente",
  "textoTitular": "texto principal creativo",
  "textoSecundario": "texto de apoyo o null",
  "assetFondoUrl": "url del asset a usar como fondo o null",
  "assetElementoUrl": "url de icono/elemento decorativo a usar o null",
  "imagenGeneradaUrl": null,
  "usarMascara": true | false,
  "generarImagen": true | false,
  "promptImagen": "prompt en inglés para generar imagen con IA, o null si no se necesita"
}

Criterios para generarImagen: true solo si no hay foto disponible en assets Y el slide se beneficia de una imagen generada.
El promptImagen debe ser específico, describir estilo fotográfico, composición y referencias visuales al copy.`
}

export function posicionFromIndex(index: number, total: number): PosicionSlide {
  if (index === 0) return 'hook'
  if (index === total - 1) return 'cta'
  return 'medio'
}

export function parseComposicion(raw: string): ComposicionSlide | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    // Validación básica de campos requeridos
    if (!parsed.layout || !parsed.colorFondo || !parsed.textoTitular) return null
    return parsed as ComposicionSlide
  } catch {
    return null
  }
}
