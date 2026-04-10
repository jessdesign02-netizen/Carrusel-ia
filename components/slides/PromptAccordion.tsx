'use client'

import { useState } from 'react'

interface Props {
  prompt: string
}

export default function PromptAccordion({ prompt }: Props) {
  const [open,    setOpen]    = useState(false)
  const [copied,  setCopied]  = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 font-medium"
      >
        <span>Ver prompt de IA</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="flex justify-end px-3 pt-2 bg-white">
            <button
              type="button"
              onClick={handleCopy}
              className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
                copied
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <pre className="px-3 py-2 bg-white text-gray-600 whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto">
            {prompt}
          </pre>
        </>
      )}
    </div>
  )
}
