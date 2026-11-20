'use client'

import { useState } from 'react'
import { History, Home, Plus, Receipt } from 'lucide-react'
import { PagoRow } from '@/components/dashboard/rows/pago-row'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { ProfileMenu } from '@/components/dashboard/profile-menu'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { BentoDashboard, type BentoDashboardProps } from '@/components/dashboard/bento-dashboard'
import { cn } from '@/lib/utils/cn'

const TABS = [
  { id: 0, label: 'Inicio', Icon: Home },
  { id: 1, label: 'Pagos', Icon: Receipt },
  { id: 2, label: 'Historial', Icon: History },
] as const

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'transferencias', label: 'Transferencias' },
] as const

type FiltroHistorial = (typeof FILTROS)[number]['id']

export function DashboardMovil(props: BentoDashboardProps) {
  const { datos, hoy } = props
  const [tab, setTab] = useState(0)
  const [filtro, setFiltro] = useState<FiltroHistorial>('todos')

  const titulo = TABS.find((item) => item.id === tab)?.label ?? 'Inicio'

  const movimientos = datos.movimientos.filter((movimiento) => {
    if (filtro === 'todos') return true
    if (filtro === 'transferencias') {
      return movimiento.operacion === 'transferencia'
    }
    if (filtro === 'gastos') {
      return (
        movimiento.tipo === 'egreso' &&
        movimiento.operacion !== 'transferencia'
      )
    }
    return (
      movimiento.tipo === 'ingreso' &&
      movimiento.operacion !== 'transferencia'
    )
  })

  return (
    <main className="min-h-dvh bg-surface-muted pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md">
        <header className="sticky top-0 z-30 grid select-none grid-cols-[2.5rem_1fr_2.5rem] items-center border-b border-line/60 bg-surface/85 px-6 pb-2 pt-[calc(1.5rem+env(safe-area-inset-top))] backdrop-blur-md">
          <div className="flex justify-start">
            <ProfileMenu />
          </div>
          <h1 className="truncate text-center text-base font-semibold text-fg">
            {titulo}
          </h1>
          <div className="flex justify-end">
            {tab === 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={props.onNuevoPago}
                aria-label="Nuevo pago"
                title="Nuevo pago"
                className="size-9 text-brand hover:bg-brand-soft"
              >
                <Plus className="size-4" aria-hidden />
              </Button>
            ) : (
              <span aria-hidden className="size-9" />
            )}
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
              className="animate-fade-in px-6 pb-4 pt-3"
            >
              <p className="px-1 pb-2 text-xs text-fg-muted">
                {datos.pagos.length}{' '}
                {datos.pagos.length === 1 ? 'pago pendiente' : 'pagos pendientes'}
              </p>

              {datos.pagos.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm text-fg-muted">
                    No hay pagos pendientes por el momento.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={props.onNuevoPago}
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Nuevo pago
                  </Button>
                </div>
              ) : (
                <div className="-mx-6 divide-y divide-line">
                  {datos.pagos.map((pago) => (
                    <div key={pago.proximo_pago_id} className="px-6">
                      <PagoRow
                        pago={pago}
                        hoy={hoy}
                        onEditar={() => props.onEditarPago(pago)}
                        onEliminar={() => props.onEliminarPago(pago)}
                        onPagar={() => props.onPagarPago(pago)}
                        onAdelantar={
                          pago.recurrente && !pago.es_tarjeta
                            ? () => props.onAdelantarPago(pago)
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 2 && (
            <div
              key="tab-historial"
              className="animate-fade-in px-6 pb-4 pt-3"
            >
              <div
                role="group"
                aria-label="Filtrar historial"
                className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {FILTROS.map((opcion) => (
                  <Chip
                    key={opcion.id}
                    role="button"
                    tabIndex={0}
                    interactive
                    size="sm"
                    variant={filtro === opcion.id ? 'brand' : 'neutral'}
                    aria-pressed={filtro === opcion.id}
                    onClick={() => setFiltro(opcion.id)}
                    onKeyDown={(evento) => {
                      if (
                        evento.key === 'Enter' ||
                        evento.key === ' '
                      ) {
                        evento.preventDefault()
                        setFiltro(opcion.id)
                      }
                    }}
                    className="shrink-0"
                  >
                    {opcion.label}
                  </Chip>
                ))}
              </div>

              {movimientos.length === 0 ? (
                <p className="py-10 text-center text-sm text-fg-muted">
                  No hay movimientos en este filtro.
                </p>
              ) : (
                <div className="-mx-6 divide-y divide-line">
                  {movimientos.map((movimiento) => (
                    <div
                      key={movimiento.transaccion_id}
                      className="px-6"
                    >
                      <MovimientoRow
                        movimiento={movimiento}
                        categoria={
                          movimiento.categoria_id != null
                            ? datos.categorias[
                                String(movimiento.categoria_id)
                              ] ?? null
                            : null
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 select-none border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={cn(
                'flex select-none flex-col items-center gap-1 py-3 text-[11px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80 active:scale-[0.98] active:duration-100',
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
