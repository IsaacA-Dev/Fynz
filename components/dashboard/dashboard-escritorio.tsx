'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Plus,
} from 'lucide-react'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { CuentaRow } from '@/components/dashboard/rows/cuenta-row'
import { PagoRow } from '@/components/dashboard/rows/pago-row'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { FynzLogo } from '@/components/ui/fynz-logo'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type {
  Cuenta,
  DatosDashboard,
  ProximoPago,
  Vista,
} from '@/lib/acciones'

const LIMITE = 4

interface DashboardEscritorioProps {
  datos: DatosDashboard
  ahora: number
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
}

export function DashboardEscritorio({
  datos,
  ahora,
  modo,
  onNuevoGasto,
  onNuevoIngreso,
  onTransferir,
  onNuevaCuenta,
  onEditarCuenta,
  onEliminarCuenta,
  onNuevoPago,
  onEditarPago,
  onEliminarPago,
  onPagarPago,
}: DashboardEscritorioProps) {
  const [verMasCuentas, setVerMasCuentas] = useState(false)
  const [verMasPagos, setVerMasPagos] = useState(false)
  const [verMasMovimientos, setVerMasMovimientos] = useState(false)

  const cuentasMostradas = verMasCuentas ? datos.cuentas : datos.cuentas.slice(0, LIMITE)
  const pagosMostrados = verMasPagos ? datos.pagos : datos.pagos.slice(0, LIMITE)
  const movimientosMostrados = verMasMovimientos
    ? datos.movimientos
    : datos.movimientos.slice(0, LIMITE)

  return (
    <main className="min-h-screen bg-[var(--color-background)] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <FynzLogo height={30} />
          <LogoutButton />
        </header>

        {/* Hero */}
        <section className="grid lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 bg-linear-to-br from-[var(--color-banner-start)] to-[var(--color-banner-end)] rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20 flex flex-col justify-center">
            <p className="text-white/85 text-sm font-medium mb-1">Disponible Real</p>
            <h2 className="text-4xl xl:text-5xl font-bold tracking-tight break-words">
              {formatearDinero(datos.disponibleReal)}
            </h2>
          </div>

          <div className="flex lg:flex-col gap-4">
            <div className="flex-1 bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border border-[var(--color-border-soft)] flex flex-col justify-center">
              <p className="text-[var(--color-text-muted)] text-xs font-medium mb-1">Dinero Líquido</p>
              <p className="text-2xl font-semibold text-[var(--color-text)]">
                {formatearDinero(datos.dineroLiquido)}
              </p>
            </div>
            <div className="flex-1 bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border border-[var(--color-border-soft)] flex flex-col justify-center">
              <p className="text-[var(--color-text-muted)] text-xs font-medium mb-1">Pagos Próximos</p>
              <p className="text-2xl font-semibold text-[var(--color-danger)]">
                -{formatearDinero(datos.totalPagos)}
              </p>
            </div>
          </div>
        </section>

        {datos.alertas.length > 0 && (
          <div className="bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[var(--color-warning)]">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-sm font-semibold">
                No alcanza el saldo para tus pagos domiciliados
              </h3>
            </div>
            {datos.alertas.map((a) => (
              <p key={a.pagoId} className="text-xs text-[var(--color-warning)] leading-relaxed">
                <strong>{a.descripcion}</strong> (domiciliado, vence{' '}
                {formatearFecha(a.fechaVencimiento)}): faltan{' '}
                <strong>{formatearDinero(a.faltante)}</strong> para cubrirlo en{' '}
                {a.cuentaNombre}.
              </p>
            ))}
          </div>
        )}

        {/* Acciones */}
        <section className="grid grid-cols-3 gap-4">
          <button
            onClick={onNuevoGasto}
            className="bg-[var(--color-surface)] rounded-2xl p-5 shadow-sm border border-[var(--color-border-soft)] flex items-center justify-center gap-3 hover:bg-[var(--color-background)] transition-colors"
          >
            <span className="text-[var(--color-danger)]">
              <ArrowUpRight className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-[var(--color-text)]">Nuevo Gasto</span>
          </button>
          <button
            onClick={onNuevoIngreso}
            className="bg-[var(--color-surface)] rounded-2xl p-5 shadow-sm border border-[var(--color-border-soft)] flex items-center justify-center gap-3 hover:bg-[var(--color-background)] transition-colors"
          >
            <span className="text-[var(--color-success)]">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-[var(--color-text)]">Nuevo Ingreso</span>
          </button>
          <button
            onClick={onTransferir}
            className="bg-[var(--color-surface)] rounded-2xl p-5 shadow-sm border border-[var(--color-border-soft)] flex items-center justify-center gap-3 hover:bg-[var(--color-background)] transition-colors"
          >
            <span className="text-[var(--color-primary)]">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-[var(--color-text)]">Transferir</span>
          </button>
        </section>

        {/* Grid 3 columnas */}
        <section className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Cuentas */}
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border-soft)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Cuentas</h3>
              <button
                onClick={onNuevaCuenta}
                aria-label="Nueva cuenta"
                className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {datos.cuentas.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Aún no tienes cuentas. Agrega la primera para empezar.
                </p>
                <button
                  onClick={onNuevaCuenta}
                  className="bg-[var(--color-primary)] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  + Nueva Cuenta
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-soft)] -mx-5 px-5">
                {cuentasMostradas.map((c) => (
                  <CuentaRow
                    key={c.cuenta_id}
                    cuenta={c}
                    onEditar={() => onEditarCuenta(c)}
                    onEliminar={() => onEliminarCuenta(c)}
                  />
                ))}
              </div>
            )}

            {datos.cuentas.length > LIMITE && (
              <button
                onClick={() => setVerMasCuentas((v) => !v)}
                className="w-full text-xs font-medium text-[var(--color-primary)] py-1 hover:opacity-80 transition-opacity"
              >
                {verMasCuentas ? 'Ver menos' : `Ver más (${datos.cuentas.length - LIMITE})`}
              </button>
            )}
          </div>

          {/* Próximos Pagos */}
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border-soft)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Próximos Pagos</h3>
              <button
                onClick={onNuevoPago}
                aria-label="Nuevo pago"
                className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {datos.pagos.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  No hay pagos pendientes por el momento.
                </p>
                <button
                  onClick={onNuevoPago}
                  className="bg-[var(--color-primary)] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  + Nuevo Pago
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-soft)] -mx-5 px-5">
                {pagosMostrados.map((p) => (
                  <PagoRow
                    key={p.proximo_pago_id}
                    pago={p}
                    ahora={ahora}
                    modo={modo}
                    onEditar={() => onEditarPago(p)}
                    onEliminar={() => onEliminarPago(p)}
                    onPagar={() => onPagarPago(p)}
                  />
                ))}
              </div>
            )}

            {datos.pagos.length > LIMITE && (
              <button
                onClick={() => setVerMasPagos((v) => !v)}
                className="w-full text-xs font-medium text-[var(--color-primary)] py-1 hover:opacity-80 transition-opacity"
              >
                {verMasPagos ? 'Ver menos' : `Ver más (${datos.pagos.length - LIMITE})`}
              </button>
            )}
          </div>

          {/* Historial */}
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border-soft)] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Historial Reciente</h3>

            {datos.movimientos.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Tus movimientos aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-soft)] -mx-5 px-5">
                {movimientosMostrados.map((t) => (
                  <MovimientoRow key={t.transaccion_id} movimiento={t} />
                ))}
              </div>
            )}

            {datos.movimientos.length > LIMITE && (
              <button
                onClick={() => setVerMasMovimientos((v) => !v)}
                className="w-full text-xs font-medium text-[var(--color-primary)] py-1 hover:opacity-80 transition-opacity"
              >
                {verMasMovimientos ? 'Ver menos' : `Ver más (${datos.movimientos.length - LIMITE})`}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
