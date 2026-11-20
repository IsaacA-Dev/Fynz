'use client'

import { useState } from 'react'
import Link from 'next/link'
import { History, Home, Plus, Receipt } from 'lucide-react'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { PagoRow } from '@/components/dashboard/rows/pago-row'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { FynzLogo } from '@/components/ui/fynz-logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeSwitcher } from '@/components/theme/theme-switcher'
import { BentoDashboard, type BentoDashboardProps } from '@/components/dashboard/bento-dashboard'
import { cn } from '@/lib/utils/cn'

const LIMITE = 4


const TABS = [
  { id: 0, label: 'Inicio', Icon: Home },
  { id: 1, label: 'Pagos', Icon: Receipt },
  { id: 2, label: 'Historial', Icon: History },
] as const

export function DashboardMovil(props: BentoDashboardProps) {
  const { datos, hoy } = props
  const [tab, setTab] = useState(0)
  const [verMasPagos, setVerMasPagos] = useState(false)

  const pagosMostrados = verMasPagos ? datos.pagos : datos.pagos.slice(0, LIMITE)
  const movimientosMostrados = datos.movimientos.slice(0, LIMITE)

  return (
    <main className="min-h-dvh bg-surface-muted pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between gap-2 px-6 pb-2 pt-6">
          <FynzLogo height={26} />
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </header>

        <div>
          {tab === 0 && (
            <div className="px-6 pb-8 pt-4">
              <BentoDashboard {...props} />
            </div>
          )}

          {tab === 1 && (
            <div
              key="tab-pagos"
              className="animate-fade-in space-y-3 px-6 pb-8 pt-4"
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <h3 className="text-eyebrow uppercase text-fg-subtle">
                  Próximos pagos
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={props.onNuevoPago}
                  aria-label="Nuevo pago"
                  className="size-8 text-brand hover:bg-brand-soft"
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>

              {datos.pagos.length === 0 ? (
                <Card variant="soft" className="p-6 text-center">
                  <p className="text-sm text-fg-muted">
                    No hay pagos pendientes por el momento.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={props.onNuevoPago}
                    className="mt-3"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Nuevo pago
                  </Button>
                </Card>
              ) : (
                <Card className="divide-y divide-line">
                  {pagosMostrados.map((p) => (
                    <PagoRow
                      key={p.proximo_pago_id}
                      pago={p}
                      hoy={hoy}
                      modo="movil"
                      onEditar={() => props.onEditarPago(p)}
                      onEliminar={() => props.onEliminarPago(p)}
                      onPagar={() => props.onPagarPago(p)}
                      onAdelantar={
                        p.recurrente && !p.es_tarjeta
                          ? () => props.onAdelantarPago(p)
                          : undefined
                      }
                    />
                  ))}
                </Card>
              )}

              {datos.pagos.length > LIMITE && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVerMasPagos((v) => !v)}
                  className="w-full"
                >
                  {verMasPagos
                    ? 'Ver menos'
                    : `Ver más (${datos.pagos.length - LIMITE})`}
                </Button>
              )}
            </div>
          )}

          {tab === 2 && (
            <div
              key="tab-historial"
              className="animate-fade-in space-y-3 px-6 pb-8 pt-4"
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <h3 className="text-eyebrow uppercase text-fg-subtle">
                  Historial reciente
                </h3>
                <Link
                  href="/historial"
                  className="text-xs font-medium text-brand transition-colors hover:text-brand-hover"
                >
                  Ver todo
                </Link>
              </div>

              {datos.movimientos.length === 0 ? (
                <Card variant="soft" className="p-6 text-center">
                  <p className="text-sm text-fg-muted">
                    Tus movimientos aparecerán aquí.
                  </p>
                </Card>
              ) : (
                <Card className="divide-y divide-line">
                  {movimientosMostrados.map((t) => (
                    <MovimientoRow
                      key={t.transaccion_id}
                      movimiento={t}
                    />
                  ))}
                </Card>
              )}

              {datos.movimientos.length > LIMITE && (
                <Link
                  href="/historial"
                  className="block w-full text-center text-xs font-medium text-brand transition-colors hover:text-brand-hover"
                >
                  Ver todo ({datos.movimientos.length - LIMITE} movimientos
                  recientes más)
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80',
                tab === id
                  ? 'text-brand'
                  : 'text-fg-muted hover:text-fg'
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  )
}
