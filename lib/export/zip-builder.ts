import JSZip from 'jszip'

interface SlideParaZip {
  numero:    number
  url_jpg:   string
  marcaNombre: string
  fecha:     string
}

export async function construirZip(slides: SlideParaZip[]): Promise<Blob> {
  const zip = new JSZip()

  await Promise.all(
    slides.map(async (slide) => {
      const nombreArchivo = `${slide.marcaNombre}_${slide.fecha}_slide${slide.numero}.jpg`

      try {
        const response = await fetch(slide.url_jpg)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        zip.file(nombreArchivo, blob)
      } catch (err) {
        console.error(`[zip] Error descargando slide ${slide.numero}:`, err)
      }
    })
  )

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
