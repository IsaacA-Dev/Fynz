'use client'

import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { esAtrasado } from '@/lib/fechas'
import { OPERACION_LABELS } from '@/lib/historial'
import { formatearDinero, formatearFechaLarga } from '@/lib/utils/format'
import type { MovimientoHistorial } from '@/lib/acciones-servidor'

interface MovimientoDetalleProps {
  movimiento: MovimientoHistorial
  hoy: string
}

export function MovimientoDetalle({
  movimiento,
  hoy,
}: MovimientoDetalleProps) {
  const esIngreso = movimiento.tipo === 'ingreso'
  const etiquetaOp =
    movimiento.operacion != null
      ? (OPERACION_LABELS[movimiento.operacion] ?? null)
      : null
  const pagoAtrasado = movimiento.pago
    ? !movimiento.pago.pagado &&
      esAtrasado(movimiento.pago.fecha_vencimiento, hoy)
    : false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            esIngreso
              ? 'bg-success-soft text-success'
              : 'bg-surface-muted text-fg-muted'
          }`}
        >
          {esIngreso ? (
            <ArrowDownLeft className="size-5" aria-hidden />
          ) : (
            <ArrowUpRight className="size-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 text-right">
          <p
            className={`text-2xl font-semibold ${
              esIngreso ? 'text-success' : 'text-fg'
            }`}
          >
            {esIngreso ? '+' : '-'}
            {formatearDinero(movimiento.monto)}
          </p>
          <p className="text-xs text-fg-muted">
            {formatearFechaLarga(movimiento.fecha)}
          </p>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <Fila etiqueta="Descripción">
          <span className="font-medium text-fg">
            {movimiento.descripcion ?? (esIngreso ? 'Ingreso' : 'Egreso')}
          </span>
        </Fila>
        <Fila etiqueta="Cuenta">
          <span className="text-fg">{movimiento.cuenta_nombre}</span>
        </Fila>
        {etiquetaOp && (
          <Fila etiqueta="Tipo de operación">
            <Badge variant="neutral" size="sm">
              {etiquetaOp}
            </Badge>
          </Fila>
        )}
        {movimiento.categoria_nombre && (
          <Fila etiqueta="Categoría">
            <span className="text-fg">{movimiento.categoria_nombre}</span>
          </Fila>
        )}
      </dl>

      {movimiento.pago && (
        <Card variant="soft" className="space-y-2 p-4 text-sm">
          <p className="text-eyebrow uppercase text-fg-subtle">
            Relación: compromiso
          </p>
          <p className="font-medium text-fg">
            {movimiento.pago.descripcion}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
            <span>
              Vencía el{' '}
              {formatearFechaLarga(movimiento.pago.fecha_vencimiento)}
            </span>
            {movimiento.pago.pagado ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="size-3" aria-hidden />
                Liquidado
              </Badge>
            ) : pagoAtrasado ? (
              <Badge variant="danger" size="sm">
                <AlertTriangle className="size-3" aria-hidden />
                Atrasado
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Pendiente
              </Badge>
            )}
          </div>
          {movimiento.pago.tarjeta_nombre && (
            <p className="text-xs text-fg-muted">
              Tarjeta: {movimiento.pago.tarjeta_nombre}
            </p>
          )}
        </Card>
      )}

      {movimiento.pareja && (
        <Card variant="soft" className="space-y-1 p-4 text-sm">
          <p className="text-eyebrow uppercase text-fg-subtle">
            Relación: transferencia
          </p>
          <p className="font-medium text-fg">
            {movimiento.tipo === 'egreso' ? 'Salida' : 'Entrada'} en{' '}
            {movimiento.pareja.cuenta_nombre}
          </p>
          <p className="text-xs text-fg-muted">
            {formatearFechaLarga(movimiento.pareja.fecha)} ·{' '}
            {formatearDinero(movimiento.pareja.monto)}
          </p>
        </Card>
      )}

      {!movimiento.pago && !movimiento.pareja && (
        <p className="text-xs text-fg-muted">
          Sin relaciones vinculadas.
        </p>
      )}
    </div>
  )
}

function Fila({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 pt-0.5 text-xs text-fg-muted">{etiqueta}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}
