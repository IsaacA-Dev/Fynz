'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from './pwa-install-provider'

interface InstallPwaButtonProps {
  variant?: 'header' | 'menu'
  onBeforeAction?: () => void
}

export function InstallPwaButton({
  variant = 'header',
  onBeforeAction,
}: InstallPwaButtonProps) {
  const { montado, puedeInstalar, solicitarInstalacion } = usePwaInstall()

  if (!montado || !puedeInstalar) return null

  const instalar = () => {
    onBeforeAction?.()
    void solicitarInstalacion()
  }

  if (variant === 'menu') {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={instalar}
        className="w-full justify-start text-fg-muted hover:bg-surface-muted hover:text-fg"
      >
        <Download className="size-4" aria-hidden />
        Instalar aplicación
      </Button>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={instalar}
        className="hidden text-xs text-fg-muted hover:bg-surface-muted hover:text-fg md:inline-flex"
      >
        <Download className="size-3.5" aria-hidden />
        Instalar aplicación
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={instalar}
        aria-label="Instalar aplicación"
        title="Instalar aplicación"
        className="size-8 text-fg-muted hover:bg-surface-muted hover:text-fg md:hidden"
      >
        <Download className="size-4" aria-hidden />
      </Button>
    </>
  )
}
