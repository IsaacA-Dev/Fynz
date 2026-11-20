'use client'

import { Download, Share, SquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePwaInstall } from './pwa-install-provider'

export function InstallPwaPrompt() {
  const { mostrarAviso, iosSafari, instalar, descartar } = usePwaInstall()

  if (!mostrarAviso) return null

  return (
    <aside
      aria-label="Instalar Fynz"
      aria-live="polite"
      className="fixed left-4 right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 md:left-auto md:right-6 md:bottom-6 md:w-[22rem]"
    >
      <Card
        variant="raised"
        className="relative border-brand/20 p-3.5 shadow-lift sm:p-4"
      >
        <button
          type="button"
          onClick={descartar}
          aria-label="Cerrar aviso de instalación"
          className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Download className="size-4" aria-hidden />
          </span>

          <div className="min-w-0 flex-1 pr-5">
            <p className="text-sm font-medium leading-snug text-fg">
              Para una mejor experiencia, instala Fynz en tu dispositivo
            </p>

            {iosSafari ? (
              <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs leading-relaxed text-fg-muted">
                Toca
                <Share className="inline size-3.5" aria-hidden />
                Compartir y luego
                <SquarePlus className="inline size-3.5" aria-hidden />
                Agregar a inicio
              </p>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => void instalar()}
                className="mt-2.5 w-full"
              >
                <Download className="size-3.5" aria-hidden />
                Instalar
              </Button>
            )}
          </div>
        </div>
      </Card>
    </aside>
  )
}
