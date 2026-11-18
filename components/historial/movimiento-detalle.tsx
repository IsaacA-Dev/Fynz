'use client'

import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { esAtrasado } from '@/lib/fechas'
import { OPERACION_LABELS } from '@/lib/historial'
import { formatearDinero, formatearFechaLarga } from '@/lib/utils/format'
import type { MovimientoHistorial } from '@/lib/acciones-servidor'

interface MovimientoDetalleProps {
  movimiento: MovimientoHistorial
  hoy: string
}

export function MovimientoDetalle({ movimiento, hoy }: MovimientoDetalleProps) {
  const esIngreso = movimiento.tipo === 'ingreso'
  const etiquetaOp =
    movimiento.operacion != null ? OPERACION_LABELS[movimiento.operacion] ?? null : null
  const pagoAtrasado = movimiento.pago
    ? !movimiento.pago.pagado && esAtrasado(movimiento.pago.fecha_vencimiento, hoy)
    : false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            esIngreso
              ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
              : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
          }`}
        >
          {esIngreso ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </span>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${
              esIngreso ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'
            }`}
          >
            {esIngreso ? '+' : '-'}
            {formatearDinero(movimiento.monto)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatearFechaLarga(movimiento.fecha)}
          </p>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <Fila etiqueta="Descripción">
          {movimiento.descripcion ?? (esIngreso ? 'Ingreso' : 'Egreso')}
        </Fila>
        <Fila etiqueta="Cuenta">{movimiento.cuenta_nombre}</Fila>
        {etiquetaOp && <Fila etiqueta="Tipo de operación">{etiquetaOp}</Fila>}
        {movimiento.categoria_nombre && (
          <Fila etiqueta="Categoría">{movimiento.categoria_nombre}</Fila>
        )}
      </dl>

      {movimiento.pago && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-soft)] rounded-2xl p-4 space-y-2 text-sm">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Relación: compromiso
          </p>
          <p className="text-[var(--color-text)] font-medium">{movimiento.pago.descripcion}</p>
          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
            Vencía el {formatearFechaLarga(movimiento.pago.fecha_vencimiento)}
            {movimiento.pago.pagado ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-success)] font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Liquidado
              </span>
            ) : pagoAtrasado ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-danger)] font-medium">
                <AlertTriangle className="w-3 h-3" />
                Atrasado
              </span>
            ) : (
              <span className="text-[var(--color-text-muted)]">Pendiente</span>
            )}
          </p>
          {movimiento.pago.tarjeta_nombre && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Tarjeta: {movimiento.pago.tarjeta_nombre}
            </p>
          )}
        </div>
      )}

      {movimiento.pareja && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-soft)] rounded-2xl p-4 space-y-1 text-sm">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Relación: transferencia
          </p>
          <p className="text-[var(--color-text)] font-medium">
            {movimiento.tipo === 'egreso' ? 'Salida' : 'Entrada'} en {movimiento.pareja.cuenta_nombre}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatearFechaLarga(movimiento.pareja.fecha)} · {formatearDinero(movimiento.pareja.monto)}
          </p>
        </div>
      )}

      {!movimiento.pago && !movimiento.pareja && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Sin relaciones vinculadas.
        </p>
      )}
    </div>
  )
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-[var(--color-text-muted)] shrink-0 pt-0.5">{etiqueta}</dt>
      <dd className="text-right min-w-0">{children}</dd>
    </div>
  )
}
