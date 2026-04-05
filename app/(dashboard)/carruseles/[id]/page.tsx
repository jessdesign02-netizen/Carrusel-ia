import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GenerarPanel from '@/components/carruseles/GenerarPanel'
import StatusControls from '@/components/carruseles/StatusControls'
import FeedbackSlide from '@/components/carruseles/FeedbackSlide'
import VersionHistory from '@/components/carruseles/VersionHistory'
import ExportarTodos from '@/components/carruseles/ExportarTodos'
import DownloadPanel from '@/components/carruseles/DownloadPanel'
import SlideCapture from '@/components/slides/SlideCapture'
import SlideRenderer from '@/components/slides/SlideRenderer'
import type { Carrusel, Slide, Marca, EstadoCarrusel, RolUsuario, ComposicionSlide } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

const ESTADO_CONFIG: Record<EstadoCarrusel, { label: string; color: string }> = {
  borrador:    { label: 'Borrador',    color: 'bg-gray-100 text-gray-600' },
  en_revision: { label: 'En revisión', color: 'bg-yellow-100 text-yellow-700' },
  aprobado:    { label: 'Aprobado',    color: 'bg-green-100 text-green-700' },
  con_cambios: { label: 'Con cambios', color: 'bg-red-100 text-red-700' },
}

export default async function CarruselDetallePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol      = (profile?.rol ?? 'editor') as RolUsuario
  const isEditor = rol === 'editor'
  const isRevisor = rol === 'revisor'

  const [{ data: carrusel }, { data: slides }] = await Promise.all([
    supabase.from('carruseles').select('*, marca:marcas(*)').eq('id', id).single(),
    supabase.from('slides').select('*').eq('carrusel_id', id).order('numero'),
  ])

  if (!carrusel) notFound()

  const c = carrusel as Carrusel & { marca: Marca }
  const s = (slides ?? []) as Slide[]
  const estado        = ESTADO_CONFIG[c.estado]
  const yaGenerado    = s.some((slide) => slide.composicion !== null)
  const todosExport   = s.every((slide) => slide.url_jpg !== null)

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{c.marca?.nombre}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estado.color}`}>
              {estado.label}
            </span>
            <span className="text-xs text-gray-400">v{c.version}</span>
          </div>
          <p className="text-sm text-gray-500 capitalize">
            {c.enfoque} · {s.length} slides
            {todosExport && <span className="ml-2 text-green-600 font-medium">· JPGs listos</span>}
          </p>
        </div>
        <a href="/carruseles" className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">
          ← Volver
        </a>
      </div>

      {/* ── Feedback general del revisor ────────────────────── */}
      {c.feedback_general && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">Feedback del revisor</p>
          <p className="text-sm text-amber-700">{c.feedback_general}</p>
        </div>
      )}

      {/* ── Controles de estado ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado</p>
            <p className="text-sm text-gray-700">
              {isEditor && c.estado === 'con_cambios' && 'El revisor solicitó cambios. Ajusta y reenvía.'}
              {isEditor && c.estado === 'borrador'    && 'Borrador — cuando esté listo, envíalo a revisión.'}
              {isEditor && c.estado === 'en_revision' && 'Esperando aprobación del revisor.'}
              {isEditor && c.estado === 'aprobado'    && 'Aprobado — puedes descargar todos los slides.'}
              {isRevisor && c.estado === 'en_revision' && 'Revisa los slides y aprueba o solicita cambios.'}
              {isRevisor && c.estado !== 'en_revision' && `Estado actual: ${estado.label}`}
            </p>
          </div>
          <StatusControls
            carruselId={id}
            estado={c.estado}
            rol={rol}
            tieneSlidesGenerados={yaGenerado}
          />
        </div>
      </div>

      {/* ── Panel de generación (solo editor) ───────────────── */}
      {isEditor && (
        <GenerarPanel carruselId={id} totalSlides={s.length} yaGenerado={yaGenerado} />
      )}

      {/* ── Exportar todos (editor, aprobado) ───────────────── */}
      {isEditor && c.estado === 'aprobado' && yaGenerado && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-green-900">Carrusel aprobado</p>
            <p className="text-xs text-green-700 mt-0.5">
              Exporta los slides a JPG y luego descarga el ZIP.
            </p>
          </div>
          <ExportarTodos slides={s} marcaNombre={c.marca?.nombre ?? 'carrusel'} />
        </div>
      )}

      {/* ── Panel de descarga ZIP (editor, aprobado) ─────────── */}
      {isEditor && c.estado === 'aprobado' && (
        <DownloadPanel
          carruselId={id}
          marcaNombre={c.marca?.nombre ?? 'carrusel'}
          slides={s}
          publicadoAt={c.publicado_at ?? null}
        />
      )}

      {/* ── Grid de slides ───────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          {yaGenerado ? `Slides generados (${s.filter(sl => sl.composicion).length}/${s.length})` : 'Slides — pendientes de generación'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {s.map((slide) => (
            <div key={slide.id} className="flex flex-col gap-2">
              {/* Preview o placeholder */}
              {slide.composicion ? (
                isEditor ? (
                  <SlideCapture
                    slideId={slide.id}
                    numero={slide.numero}
                    total={s.length}
                    composicion={slide.composicion as ComposicionSlide}
                    urlJpg={slide.url_jpg}
                    onExported={() => {}}
                  />
                ) : (
                  <div
                    style={{ width: 360, height: 360, position: 'relative', overflow: 'hidden', borderRadius: 12 }}
                    className="shadow-lg border border-gray-200 mx-auto"
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1080, transformOrigin: 'top left', transform: `scale(${360 / 1080})`, pointerEvents: 'none' }}>
                      <SlideRenderer
                        composicion={slide.composicion as ComposicionSlide}
                        numero={slide.numero}
                        total={s.length}
                        exportMode
                      />
                    </div>
                  </div>
                )
              ) : (
                <div className="w-[180px] h-[180px] mx-auto bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center p-3">
                    <p className="text-2xl font-bold text-gray-300">{slide.numero}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-3">{slide.copy}</p>
                  </div>
                </div>
              )}

              {/* Feedback por slide */}
              <FeedbackSlide
                slideId={slide.id}
                carruselId={id}
                feedback={slide.feedback_slide}
                isRevisor={isRevisor}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Historial de versiones ───────────────────────────── */}
      <VersionHistory carruselId={id} />
    </div>
  )
}
