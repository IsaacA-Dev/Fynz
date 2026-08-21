'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

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
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
