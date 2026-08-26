'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useAnime } from '@/components/hooks/use-anime'
import { usePresencia } from '@/components/hooks/use-presencia'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  const { animar, reducirMovimiento } = useAnime()
  const presente = usePresencia(open, reducirMovimiento ? 0 : 250)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel || reducirMovimiento) return

    if (open) {
      overlay.style.opacity = '0'
      panel.style.opacity = '0'
      animar(overlay, { duracion: 'rapida', opacity: [0, 1] })
      animar(panel, { duracion: 'normal', opacity: [0, 1], translateY: [24, 0] })
    } else if (presente) {
      animar(overlay, { duracion: 'rapida', opacity: [1, 0] })
      animar(panel, { duracion: 'rapida', opacity: [1, 0], translateY: [0, 16] })
    }
  }, [animar, reducirMovimiento, open, presente])

  if (!presente) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        ref={overlayRef}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-[var(--color-surface)] rounded-t-3xl p-6 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl border-t border-[var(--color-border)]"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
