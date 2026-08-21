'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToast, type ToastType } from './toast-provider'

const icons = {
  success: <CheckCircle2 size={18} className="text-[var(--color-primary)]" />,
  error: <AlertCircle size={18} className="text-[var(--color-error)]" />,
  info: <Info size={18} className="text-[var(--color-primary)]" />,
}

export function ToastViewport() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-xs">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-sm"
          >
            {icons[toast.type as ToastType]}
            <p className="flex-1 text-sm text-[var(--color-text)]">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
