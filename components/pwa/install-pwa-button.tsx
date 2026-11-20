'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from './pwa-install-provider'

export function InstallPwaButton() {
  const { montado, puedeInstalar, solicitarInstalacion } = usePwaInstall()

  if (!montado || !puedeInstalar) return null

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void solicitarInstalacion()}
        className="hidden text-xs text-fg-muted hover:bg-surface-muted hover:text-fg md:inline-flex"
      >
        <Download className="size-3.5" aria-hidden />
        Instalar aplicación
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => void solicitarInstalacion()}
        aria-label="Instalar aplicación"
        title="Instalar aplicación"
        className="size-8 text-fg-muted hover:bg-surface-muted hover:text-fg md:hidden"
      >
        <Download className="size-4" aria-hidden />
      </Button>
    </>
  )
}
