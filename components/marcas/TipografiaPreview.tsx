'use client'

import { useEffect } from 'react'
import type { Tipografia } from '@/types'

interface Props {
  tipografias: Tipografia[]
}

export default function TipografiaPreview({ tipografias }: Props) {
  useEffect(() => {
    tipografias.forEach(({ nombre }) => {
      if (!nombre || nombre === 'Inter' || nombre === 'system-ui') return
      const encoded = nombre.replace(/ /g, '+')
      const href    = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700;800&display=swap`
      if (document.querySelector(`link[href="${href}"]`)) return
      const link  = document.createElement('link')
      link.rel    = 'stylesheet'
      link.href   = href
      document.head.appendChild(link)
    })
  }, [tipografias])

  if (!tipografias || tipografias.length === 0) {
    return <p className="text-sm text-gray-400 italic">Sin tipografías configuradas.</p>
  }

  return (
    <div className="space-y-4">
      {tipografias.map((t, i) => (
        <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex-1 min-w-0">
            <p
              style={{ fontFamily: `"${t.nombre}", Inter, system-ui, sans-serif`, fontWeight: 700, fontSize: 28, lineHeight: 1.2 }}
              className="text-gray-900 truncate"
            >
              {t.nombre}
            </p>
            <p
              style={{ fontFamily: `"${t.nombre}", Inter, system-ui, sans-serif`, fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}
              className="text-gray-500 mt-1"
            >
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="flex-shrink-0 text-right space-y-0.5">
            <p className="text-xs font-semibold text-gray-700 font-mono">{t.nombre}</p>
            {t.peso && <p className="text-xs text-gray-400">Peso: {t.peso}</p>}
            {t.uso  && <p className="text-xs text-indigo-600 capitalize">{t.uso}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
