'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { InstallPwaButton } from '@/components/pwa/install-pwa-button'
import { ThemeSwitcher } from '@/components/theme/theme-switcher'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { LogoutButton } from './logout-button'

export function ProfileMenu() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú de perfil"
        title="Perfil y ajustes"
        className="size-9 text-fg-muted hover:bg-surface-muted hover:text-fg"
      >
        <Settings className="size-4" aria-hidden />
      </Button>

      <Sheet
        open={abierto}
        title="Perfil"
        onClose={() => setAbierto(false)}
      >
        <div className="select-none space-y-5">
          <section>
            <p className="text-eyebrow uppercase text-fg-subtle">
              Apariencia
            </p>
            <ThemeSwitcher variant="panel" className="mt-2" />
          </section>

          <section className="space-y-2 border-t border-line pt-4">
            <p className="text-eyebrow uppercase text-fg-subtle">Cuenta</p>
            <InstallPwaButton
              variant="menu"
              onBeforeAction={() => setAbierto(false)}
            />
            <LogoutButton variant="menu" />
          </section>
        </div>
      </Sheet>
    </>
  )
}
