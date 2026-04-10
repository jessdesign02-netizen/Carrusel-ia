// ─── Marcas ─────────────────────────────────────────────────────────────────

export interface ColorPaleta {
  primario: string
  secundario: string
  acento: string
  neutro: string
  [key: string]: string
}

export interface Tipografia {
  nombre: string
  peso: string
  uso: string
}

export interface Marca {
  id: string
  nombre: string
  colores: ColorPaleta
  tipografias: Tipografia[]
  tono_visual: string | null
  created_at: string
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export type TipoAsset = 'logo' | 'fondo' | 'icono' | 'elemento' | 'foto' | 'efecto'

export interface AssetMarca {
  id: string
  marca_id: string
  tipo: TipoAsset
  url: string
  descripcion: string | null
  tags: string[] | null
}

// ─── Carruseles ──────────────────────────────────────────────────────────────

export type EnfoqueCarrusel = 'educativo' | 'promocional' | 'storytelling' | 'tendencia' | 'otro'

export type EstadoCarrusel = 'borrador' | 'en_revision' | 'aprobado' | 'con_cambios'

export interface Carrusel {
  id: string
  marca_id: string
  enfoque: EnfoqueCarrusel
  estado: EstadoCarrusel
  feedback_general: string | null
  notas: string | null
  imagen_referencia: string | null
  version: number
  publicado_at: string | null
  created_at: string
  updated_at: string
  marca?: Marca
  slides?: Slide[]
}

// ─── Slides ───────────────────────────────────────────────────────────────────

export type PosicionSlide = 'hook' | 'medio' | 'cta'

export interface Slide {
  id: string
  carrusel_id: string
  numero: number
  copy: string
  sugerencia_visual: string | null
  url_jpg: string | null
  feedback_slide: string | null
  prompt_usado: string | null
  composicion: ComposicionSlide | null
}

// ─── Auth / Usuarios ─────────────────────────────────────────────────────────

export type RolUsuario = 'editor' | 'revisor'

export interface Profile {
  id: string
  email: string
  rol: RolUsuario
  nombre: string | null
}

// ─── Motor IA ─────────────────────────────────────────────────────────────────

export interface ComposicionSlide {
  layout: 'hook' | 'texto-imagen' | 'imagen-texto' | 'texto-centrado' | 'cta'
  colorFondo: string
  colorTexto: string
  colorAcento: string
  tipografia: string
  textoTitular: string
  textoSecundario: string | null
  assetFondoUrl: string | null
  assetElementoUrl: string | null
  imagenGeneradaUrl: string | null
  usarMascara: boolean
  generarImagen: boolean
  promptImagen: string | null
}

export interface InstruccionesGeneracion {
  marcaId: string
  carruselId: string
  enfoque: EnfoqueCarrusel
  slides: Array<{
    slideId: string
    numero: number
    copy: string
    sugerenciaVisual: string | null
    posicion: PosicionSlide
  }>
}
