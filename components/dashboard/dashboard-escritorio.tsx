'use client'

import { LogoutButton } from '@/components/dashboard/logout-button'
import { FynzLogo } from '@/components/ui/fynz-logo'
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
    <main className="min-h-screen bg-[var(--color-background)] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center">
          <FynzLogo height={30} />
          <LogoutButton />
        </header>

        <div className="mt-6">
          <PanelLayout {...props} />
        </div>
      </div>
    </main>
  )
}
