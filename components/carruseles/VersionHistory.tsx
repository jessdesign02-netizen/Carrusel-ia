import { createClient } from '@/lib/supabase/server'
import type { Slide, ComposicionSlide } from '@/types'
import SlideRenderer from '@/components/slides/SlideRenderer'

interface VersionRow {
  id:          string
  version:     number
  created_at:  string
  slides_data: Slide[]
}

interface Props {
  carruselId: string
}

export default async function VersionHistory({ carruselId }: Props) {
  const supabase = await createClient()

  const { data: versiones } = await supabase
    .from('versiones_carrusel')
    .select('*')
    .eq('carrusel_id', carruselId)
    .order('version', { ascending: false })

  if (!versiones || versiones.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Historial de versiones ({versiones.length})
      </h3>

      <div className="space-y-6">
        {(versiones as VersionRow[]).map((v) => {
          const slidesConComp = v.slides_data.filter(
            (s) => s.composicion !== null
          )
          return (
            <div key={v.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  v{v.version}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(v.created_at).toLocaleDateString('es-AR', {
                    day:    '2-digit',
                    month:  'short',
                    year:   'numeric',
                    hour:   '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {slidesConComp.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {slidesConComp.map((s) => (
                    <div
                      key={s.id}
                      style={{ width: 120, height: 120, flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: 8 }}
                      className="border border-gray-200 shadow-sm"
                    >
                      <div
                        style={{
                          position:        'absolute',
                          top:             0,
                          left:            0,
                          width:           1080,
                          height:          1080,
                          transformOrigin: 'top left',
                          transform:       `scale(${120 / 1080})`,
                          pointerEvents:   'none',
                        }}
                      >
                        <SlideRenderer
                          composicion={s.composicion as ComposicionSlide}
                          numero={s.numero}
                          total={slidesConComp.length}
                          exportMode
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  {v.slides_data.length} slides (sin composición guardada)
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
