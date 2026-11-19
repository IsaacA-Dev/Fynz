'use client'

import { LogoutButton } from '@/components/dashboard/logout-button'
import { FynzLogo } from '@/components/ui/fynz-logo'
import { ThemeSwitcher } from '@/components/theme/theme-switcher'
import { PanelLayout } from '@/components/dashboard/panel'
import type { ReactNode } from 'react'
import type { Cuenta, DatosDashboard, ProximoPago, Vista } from '@/lib/acciones'

interface DashboardEscritorioProps {
  datos: DatosDashboard
  hoy: string
  horizonteControl: ReactNode
  modo: Vista
  onNuevoGasto: () => void
  onNuevoIngreso: () => void
  onTransferir: () => void
  onNuevaCuenta: () => void
  onEditarCuenta: (cuenta: Cuenta) => void
  onEliminarCuenta: (cuenta: Cuenta) => void
  onNuevoPago: () => void
  onEditarPago: (pago: ProximoPago) => void
  onEliminarPago: (pago: ProximoPago) => void
  onPagarPago: (pago: ProximoPago) => void
  onAdelantarPago: (pago: ProximoPago) => void
}

export function DashboardEscritorio(props: DashboardEscritorioProps) {
  return (
    <main className="min-h-dvh bg-surface-muted p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-2">
          <FynzLogo height={30} />
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </header>

        <div className="mt-6">
          <PanelLayout {...props} />
        </div>
      </div>
    </main>
  )
}
