import type { ComposicionSlide } from '@/types'

interface Props {
  composicion: ComposicionSlide
  numero: number
  total: number
  /** Si es true, renderiza al tamaño de exportación (1080x1080) */
  exportMode?: boolean
}

const SLIDE_SIZE = 1080

export default function SlideRenderer({ composicion, numero, total, exportMode = false }: Props) {
  const {
    layout,
    colorFondo,
    colorTexto,
    colorAcento,
    tipografia,
    textoTitular,
    textoSecundario,
    assetFondoUrl,
    assetElementoUrl,
    imagenGeneradaUrl,
    usarMascara,
  } = composicion

  const imagenUrl = imagenGeneradaUrl ?? assetFondoUrl
  const scale = exportMode ? 1 : 360 / SLIDE_SIZE

  // Tamaños de fuente relativos al tamaño del slide
  const fontSize = {
    hook:           { titular: 88, secundario: 44 },
    'texto-imagen': { titular: 66, secundario: 36 },
    'imagen-texto': { titular: 66, secundario: 36 },
    'texto-centrado':{ titular: 72, secundario: 38 },
    cta:            { titular: 64, secundario: 38 },
  }[layout] ?? { titular: 72, secundario: 38 }

  const containerStyle: React.CSSProperties = {
    width:           SLIDE_SIZE,
    height:          SLIDE_SIZE,
    backgroundColor: colorFondo,
    fontFamily:      `"${tipografia}", Inter, system-ui, sans-serif`,
    position:        'relative',
    overflow:        'hidden',
    flexShrink:      0,
    transform:       exportMode ? undefined : `scale(${scale})`,
    transformOrigin: exportMode ? undefined : 'top left',
  }

  return (
    <div style={containerStyle}>
      {/* ── Fondo / imagen ──────────────────────────────────── */}
      {imagenUrl && (layout === 'hook' || layout === 'texto-centrado') && (
        <div
          style={{
            position:         'absolute',
            inset:            0,
            backgroundImage:  `url(${imagenUrl})`,
            backgroundSize:   'cover',
            backgroundPosition: 'center',
            opacity:          usarMascara ? 0.35 : 0.6,
          }}
        />
      )}

      {/* ── Overlay gradiente ───────────────────────────────── */}
      {(layout === 'hook' || (imagenUrl && usarMascara)) && (
        <div
          style={{
            position: 'absolute',
            inset:    0,
            background: `linear-gradient(160deg, ${colorFondo}cc 0%, ${colorFondo}88 50%, ${colorFondo}ee 100%)`,
          }}
        />
      )}

      {/* ── Layouts ─────────────────────────────────────────── */}
      {layout === 'hook' && (
        <HookLayout
          titular={textoTitular}
          secundario={textoSecundario}
          colorTexto={colorTexto}
          colorAcento={colorAcento}
          fontSize={fontSize}
          elementoUrl={assetElementoUrl}
          numero={numero}
          total={total}
        />
      )}

      {layout === 'texto-centrado' && (
        <TextoCentradoLayout
          titular={textoTitular}
          secundario={textoSecundario}
          colorTexto={colorTexto}
          colorAcento={colorAcento}
          fontSize={fontSize}
          elementoUrl={assetElementoUrl}
          numero={numero}
          total={total}
        />
      )}

      {layout === 'texto-imagen' && (
        <TextoImagenLayout
          titular={textoTitular}
          secundario={textoSecundario}
          colorTexto={colorTexto}
          colorAcento={colorAcento}
          colorFondo={colorFondo}
          fontSize={fontSize}
          imagenUrl={imagenUrl}
          textoIzquierda
          numero={numero}
          total={total}
        />
      )}

      {layout === 'imagen-texto' && (
        <TextoImagenLayout
          titular={textoTitular}
          secundario={textoSecundario}
          colorTexto={colorTexto}
          colorAcento={colorAcento}
          colorFondo={colorFondo}
          fontSize={fontSize}
          imagenUrl={imagenUrl}
          textoIzquierda={false}
          numero={numero}
          total={total}
        />
      )}

      {layout === 'cta' && (
        <CtaLayout
          titular={textoTitular}
          secundario={textoSecundario}
          colorTexto={colorTexto}
          colorAcento={colorAcento}
          colorFondo={colorFondo}
          fontSize={fontSize}
          elementoUrl={assetElementoUrl}
          numero={numero}
          total={total}
        />
      )}
    </div>
  )
}

// ── Sub-layouts ────────────────────────────────────────────────────────────

interface LayoutProps {
  titular: string
  secundario: string | null
  colorTexto: string
  colorAcento: string
  fontSize: { titular: number; secundario: number }
  numero: number
  total: number
  elementoUrl?: string | null
}

function HookLayout({ titular, secundario, colorTexto, colorAcento, fontSize, elementoUrl, numero, total }: LayoutProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 80 }}>
      {elementoUrl && (
        <img
          src={elementoUrl}
          alt=""
          style={{ position: 'absolute', top: 60, right: 60, width: 120, height: 120, objectFit: 'contain', opacity: 0.9 }}
        />
      )}
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: 60, height: 6, backgroundColor: colorAcento, marginBottom: 32, borderRadius: 3 }} />
        <div style={{ fontSize: fontSize.titular, fontWeight: 800, color: colorTexto, lineHeight: 1.1, letterSpacing: '-2px' }}>
          {titular}
        </div>
        {secundario && (
          <div style={{ fontSize: fontSize.secundario, fontWeight: 400, color: colorTexto, opacity: 0.75, marginTop: 24, lineHeight: 1.4 }}>
            {secundario}
          </div>
        )}
      </div>
      <SlideCounter numero={numero} total={total} color={colorTexto} />
    </div>
  )
}

function TextoCentradoLayout({ titular, secundario, colorTexto, colorAcento, fontSize, elementoUrl, numero, total }: LayoutProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, textAlign: 'center' }}>
      {elementoUrl && (
        <img src={elementoUrl} alt="" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 40, opacity: 0.9 }} />
      )}
      <div style={{ fontSize: fontSize.titular, fontWeight: 700, color: colorTexto, lineHeight: 1.15, letterSpacing: '-1px' }}>
        {titular}
      </div>
      {secundario && (
        <>
          <div style={{ width: 48, height: 4, backgroundColor: colorAcento, margin: '32px auto', borderRadius: 2 }} />
          <div style={{ fontSize: fontSize.secundario, fontWeight: 400, color: colorTexto, opacity: 0.8, lineHeight: 1.5 }}>
            {secundario}
          </div>
        </>
      )}
      <div style={{ position: 'absolute', bottom: 48, right: 64 }}>
        <SlideCounter numero={numero} total={total} color={colorTexto} />
      </div>
    </div>
  )
}

interface TextoImagenProps extends LayoutProps {
  imagenUrl: string | null
  colorFondo: string
  textoIzquierda: boolean
}

function TextoImagenLayout({ titular, secundario, colorTexto, colorAcento, colorFondo, fontSize, imagenUrl, textoIzquierda, numero, total }: TextoImagenProps) {
  const textoPart = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px' }}>
      <div style={{ width: 40, height: 4, backgroundColor: colorAcento, marginBottom: 24, borderRadius: 2 }} />
      <div style={{ fontSize: fontSize.titular, fontWeight: 700, color: colorTexto, lineHeight: 1.15, letterSpacing: '-1px' }}>
        {titular}
      </div>
      {secundario && (
        <div style={{ fontSize: fontSize.secundario, fontWeight: 400, color: colorTexto, opacity: 0.75, marginTop: 20, lineHeight: 1.5 }}>
          {secundario}
        </div>
      )}
      <div style={{ marginTop: 48 }}>
        <SlideCounter numero={numero} total={total} color={colorTexto} />
      </div>
    </div>
  )

  const imagenPart = (
    <div style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      clipPath: textoIzquierda ? 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
    }}>
      {imagenUrl ? (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${imagenUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: colorAcento, opacity: 0.15 }} />
      )}
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'row', backgroundColor: colorFondo }}>
      {textoIzquierda ? <>{textoPart}{imagenPart}</> : <>{imagenPart}{textoPart}</>}
    </div>
  )
}

interface CtaProps extends LayoutProps {
  colorFondo: string
}

function CtaLayout({ titular, secundario, colorTexto, colorAcento, colorFondo, fontSize, elementoUrl, numero, total }: CtaProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 80, textAlign: 'center',
      background: `linear-gradient(135deg, ${colorFondo} 0%, ${colorAcento}22 100%)`,
    }}>
      {elementoUrl && (
        <img src={elementoUrl} alt="" style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 48, opacity: 0.95 }} />
      )}
      <div style={{ fontSize: fontSize.titular, fontWeight: 800, color: colorTexto, lineHeight: 1.1, letterSpacing: '-1.5px' }}>
        {titular}
      </div>
      {secundario && (
        <div style={{
          fontSize: fontSize.secundario, fontWeight: 400,
          color: colorTexto, opacity: 0.8,
          marginTop: 28, lineHeight: 1.6,
          backgroundColor: `${colorAcento}22`,
          padding: '20px 32px', borderRadius: 16,
          borderLeft: `4px solid ${colorAcento}`,
        }}>
          {secundario}
        </div>
      )}
      <div style={{
        marginTop: 48, width: 64, height: 4,
        backgroundColor: colorAcento, borderRadius: 2,
      }} />
      <div style={{ position: 'absolute', bottom: 48, right: 64 }}>
        <SlideCounter numero={numero} total={total} color={colorTexto} />
      </div>
    </div>
  )
}

function SlideCounter({ numero, total, color }: { numero: number; total: number; color: string }) {
  return (
    <div style={{ fontSize: 28, fontWeight: 600, color, opacity: 0.4, letterSpacing: 1 }}>
      {numero}/{total}
    </div>
  )
}
