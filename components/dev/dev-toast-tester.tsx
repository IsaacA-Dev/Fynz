'use client'

import { useToast } from '@/components/ui/toast'

export function DevToastTester() {
  const { addToast } = useToast()

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={() => addToast('Éxito: registro completado', 'success')}
        className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl text-xs font-medium"
      >
        Toast success
      </button>
      <button
        onClick={() => addToast('Error: credenciales inválidas', 'error')}
        className="bg-[var(--color-error)] text-white px-4 py-2 rounded-xl text-xs font-medium"
      >
        Toast error
      </button>
      <button
        onClick={() => addToast('Info: revisa tu correo', 'info')}
        className="bg-[var(--color-text-muted)] text-white px-4 py-2 rounded-xl text-xs font-medium"
      >
        Toast info
      </button>
    </div>
  )
}
