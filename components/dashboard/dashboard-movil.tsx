'use client'

import { useState } from 'react'
import Link from 'next/link'
import { History, Home, Plus, Receipt } from 'lucide-react'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { PagoRow } from '@/components/dashboard/rows/pago-row'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { FynzLogo } from '@/components/ui/fynz-logo'
import { Entrada } from '@/components/ui/motion'
import { PanelLayout } from '@/components/dashboard/panel'
import type { ReactNode } from 'react'
import type { Cuenta, DatosDashboard, ProximoPago, Vista } from '@/lib/acciones'

const LIMITE = 4

interface DashboardMovilProps {
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

const TABS = [
  { id: 0, label: 'Inicio', Icon: Home },
  { id: 1, label: 'Pagos', Icon: Receipt },
  { id: 2, label: 'Historial', Icon: History },
] as const

export function DashboardMovil(props: DashboardMovilProps) {
  const { datos, hoy } = props
  const [tab, setTab] = useState(0)
  const [direccion, setDireccion] = useState(1)
  const [verMasPagos, setVerMasPagos] = useState(false)

  const cambiarTab = (nuevo: number) => {
    if (nuevo === tab) return
    setDireccion(nuevo > tab ? 1 : -1)
    setTab(nuevo)
  }

  const pagosMostrados = verMasPagos ? datos.pagos : datos.pagos.slice(0, LIMITE)
  const movimientosMostrados = datos.movimientos.slice(0, LIMITE)

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-md mx-auto">
        <header className="flex justify-between items-center px-6 pt-6 pb-2">
          <FynzLogo height={26} />
          <LogoutButton />
        </header>

        <div>
          {tab === 0 && (
            <div className="px-6 pb-8 pt-4">
              <PanelLayout {...props} />
            </div>
          )}

          {tab === 1 && (
            <Entrada
              key="tab-pagos"
              duracion="normal"
              desdeX={30 * direccion}
              className="px-6 pb-8 pt-4 space-y-3"
            >
              {/* ===== Tab 1: Próximos Pagos ===== */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-text)] px-1">Próximos Pagos</h3>
                <button
                  onClick={props.onNuevoPago}
                  aria-label="Nuevo pago"
                  className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {datos.pagos.length === 0 ? (
                <div className="bg-[var(--color-surface)] rounded-2xl p-6 text-center shadow-sm border border-[var(--color-border-soft)] space-y-3">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No hay pagos pendientes por el momento.
                  </p>
                  <button
                    onClick={props.onNuevoPago}
                    className="bg-[var(--color-primary)] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
                  >
                    + Nuevo Pago
                  </button>
                </div>
              ) : (
                <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border-soft)] divide-y divide-[var(--color-border-soft)]">
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
                        p.recurrente && !p.es_tarjeta ? () => props.onAdelantarPago(p) : undefined
                      }
                    />
                  ))}
                </div>
              )}

              {datos.pagos.length > LIMITE && (
                <button
                  onClick={() => setVerMasPagos((v) => !v)}
                  className="w-full text-xs font-medium text-[var(--color-primary)] py-2 hover:opacity-80 transition-opacity"
                >
                  {verMasPagos ? 'Ver menos' : `Ver más (${datos.pagos.length - LIMITE})`}
                </button>
              )}
            </Entrada>
          )}

          {tab === 2 && (
            <Entrada
              key="tab-historial"
              duracion="normal"
              desdeX={30 * direccion}
              className="px-6 pb-8 pt-4 space-y-3"
            >
              {/* ===== Tab 2: Historial ===== */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Historial Reciente</h3>
                <Link
                  href="/historial"
                  className="text-xs font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                >
                  Ver todo
                </Link>
              </div>

              {datos.movimientos.length === 0 ? (
                <div className="bg-[var(--color-surface)] rounded-2xl p-6 text-center shadow-sm border border-[var(--color-border-soft)]">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Tus movimientos aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border-soft)] divide-y divide-[var(--color-border-soft)]">
                  {movimientosMostrados.map((t) => (
                    <MovimientoRow key={t.transaccion_id} movimiento={t} />
                  ))}
                </div>
              )}

              {datos.movimientos.length > LIMITE && (
                <Link
                  href="/historial"
                  className="block w-full text-center text-xs font-medium text-[var(--color-primary)] py-2 hover:opacity-80 transition-opacity"
                >
                  Ver todo ({datos.movimientos.length - LIMITE} movimientos recientes más)
                </Link>
              )}
            </Entrada>
          )}
        </div>

        <nav className="sticky bottom-0 z-40 bg-[var(--color-background)]/90 backdrop-blur border-t border-[var(--color-border-soft)]">
          <div className="grid grid-cols-3">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => cambiarTab(id)}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  tab === id
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </main>
  )
}
