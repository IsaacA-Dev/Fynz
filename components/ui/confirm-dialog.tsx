'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import { usePresencia } from '@/components/hooks/use-presencia'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { animar, reducirMovimiento } = useAnime()
  const presente = usePresencia(open, reducirMovimiento ? 0 : 250)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel || reducirMovimiento) return

    if (open) {
      overlay.style.opacity = '0'
      panel.style.opacity = '0'
      animar(overlay, { duracion: 'rapida', opacity: [0, 1] })
      animar(panel, {
        duracion: 'normal',
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.96, 1],
      })
    } else if (presente) {
      animar(overlay, { duracion: 'rapida', opacity: [1, 0] })
      animar(panel, {
        duracion: 'rapida',
        opacity: [1, 0],
        translateY: [0, 16],
        scale: [1, 0.96],
      })
    }
  }, [animar, reducirMovimiento, open, presente])

  if (!presente) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        ref={overlayRef}
        onClick={onCancel}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xs bg-[var(--color-surface)] rounded-2xl p-6 shadow-lg border border-[var(--color-border)] space-y-4"
      >
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {message}
        </p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-medium bg-[var(--color-border)]/50 text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-medium text-white transition-colors ${
              danger
                ? 'bg-[var(--color-error)] hover:opacity-90'
                : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
