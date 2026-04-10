'use client'

import { useEffect } from 'react'

interface Props {
  fontName: string
}

/**
 * Inyecta un <link> de Google Fonts en el <head> del documento
 * para que el SlideRenderer preview use la tipografía correcta.
 * Solo actúa si la fuente no es una fuente del sistema.
 */
export default function FontLoader({ fontName }: Props) {
  useEffect(() => {
    if (!fontName || fontName === 'Inter' || fontName === 'system-ui' || fontName === 'sans-serif') return

    const encoded  = fontName.replace(/ /g, '+')
    const href     = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,700;0,800;1,400&display=swap`
    const existing = document.querySelector(`link[href="${href}"]`)

    if (existing) return

    const link  = document.createElement('link')
    link.rel    = 'preconnect'
    const preconnect = document.createElement('link')
    preconnect.rel   = 'preconnect'
    preconnect.href  = 'https://fonts.googleapis.com'

    const preconnect2      = document.createElement('link')
    preconnect2.rel        = 'preconnect'
    preconnect2.href       = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'

    const styleLink  = document.createElement('link')
    styleLink.rel    = 'stylesheet'
    styleLink.href   = href

    document.head.appendChild(preconnect)
    document.head.appendChild(preconnect2)
    document.head.appendChild(styleLink)
  }, [fontName])

  return null
}
