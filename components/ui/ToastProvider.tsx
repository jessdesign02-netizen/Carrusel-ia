'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id:      number
  message: string
  type:    ToastType
}

interface ToastCtx {
  addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    info:    'bg-indigo-600',
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${colors[t.type]} text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto animate-fade-in-up max-w-xs`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-white/70 hover:text-white flex-shrink-0 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
