'use client'

import { useLayoutEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useAnime } from '@/components/hooks/use-anime'
import { useToast, type ToastType } from './toast-provider'

const icons = {
  success: <CheckCircle2 size={18} className="text-[var(--color-primary)]" />,
  error: <AlertCircle size={18} className="text-[var(--color-error)]" />,
  info: <Info size={18} className="text-[var(--color-primary)]" />,
}

function ToastItem({
  id,
  message,
  type,
  saliendo,
}: {
  id: number
  message: string
  type: ToastType
  saliendo?: boolean
}) {
  const { animar, reducirMovimiento } = useAnime()
  const { removeToast, descartarToast } = useToast()
  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const elemento = ref.current
    if (!elemento || reducirMovimiento) return
    animar(elemento, {
      duracion: 'rapida',
      opacity: [0, 1],
      translateY: [-12, 0],
      scale: [0.96, 1],
    })
  }, [animar, reducirMovimiento])

  useLayoutEffect(() => {
    const elemento = ref.current
    if (!elemento || !saliendo) return
    if (reducirMovimiento) {
      descartarToast(id)
      return
    }
    animar(elemento, {
      duracion: 'rapida',
      opacity: [1, 0],
      translateY: [0, -8],
      scale: [0.96, 0.96],
      onComplete: () => descartarToast(id),
    })
  }, [animar, reducirMovimiento, saliendo, descartarToast, id])

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-sm"
    >
      {icons[type as ToastType]}
      <p className="flex-1 text-sm text-[var(--color-text)]">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastViewport() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-xs">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  )
}
