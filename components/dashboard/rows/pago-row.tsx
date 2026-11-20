'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  Check,
  CreditCard,
  Pencil,
  Repeat,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import { esAtrasado } from '@/lib/fechas'
import { etiquetaFrecuencia } from '@/lib/recurrencia'
import type { ProximoPago } from '@/lib/acciones'

interface PagoRowProps {
  pago: ProximoPago
  hoy: string
  onEditar: () => void
  onEliminar: () => void
  onPagar: () => void
  onAdelantar?: () => void
}

export function PagoRow({
  pago,
  hoy,
  onEditar,
  onEliminar,
  onPagar,
  onAdelantar,
}: PagoRowProps) {
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const atrasado = !pago.pagado && esAtrasado(pago.fecha_vencimiento, hoy)
  const frecuencia = pago.recurrente
    ? etiquetaFrecuencia(pago.frecuencia, pago.dia_cobro)
    : null
  const metadatos = [
    pago.cuenta_nombre,
    `Vence ${formatearFecha(pago.fecha_vencimiento)}`,
    frecuencia,
    pago.domiciliado ? 'Domiciliado' : null,
    pago.es_tarjeta ? 'Tarjeta' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const Icono = pago.es_tarjeta ? CreditCard : CalendarClock

  const cerrarY = (accion?: () => void) => {
    setDetalleAbierto(false)
    if (!accion) return
    window.setTimeout(accion, 320)
  }

  return (
    <div className="relative grid min-h-[4.75rem] select-none grid-cols-[auto_1fr_auto] items-center gap-3 py-3 transition-transform duration-100 active:scale-[0.99]">
      <button
        type="button"
        onClick={() => setDetalleAbierto(true)}
        aria-label={`Abrir detalle de ${pago.descripcion}`}
        aria-haspopup="dialog"
        aria-expanded={detalleAbierto}
        className="absolute inset-0 z-0 rounded-panel transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
      />

      <span
        className="pointer-events-none relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
        aria-hidden
      >
        <Icono className="size-4" />
      </span>

      <div className="pointer-events-none relative z-10 min-w-0">
        <p
          className={cn(
            'truncate text-sm font-medium',
            atrasado ? 'text-danger' : 'text-fg'
          )}
        >
          {pago.descripcion}
        </p>
        <p
          className={cn(
            'truncate text-xs',
            atrasado ? 'text-danger' : 'text-fg-muted'
          )}
        >
          {metadatos}
        </p>
      </div>

      <div className="pointer-events-none relative z-10 flex shrink-0 flex-col items-end text-right">
        <p
          className={cn(
            'whitespace-nowrap text-sm font-semibold tabular-nums',
            atrasado ? 'text-danger' : 'text-fg'
          )}
        >
          {formatearDinero(pago.monto)}
        </p>

        <div className="mt-0.5 flex h-7 items-center">
          {atrasado ? (
            <Badge variant="danger" size="sm">
              <AlertTriangle className="size-3" aria-hidden />
              Atrasado
            </Badge>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={(evento) => {
                evento.stopPropagation()
                onPagar()
              }}
              aria-label={`Pagar ${pago.descripcion}`}
              className="pointer-events-auto h-7 rounded-full px-2.5 text-[11px]"
            >
              <Check className="size-3.5" aria-hidden />
              Pagar
            </Button>
          )}
        </div>
      </div>

      <Sheet
        open={detalleAbierto}
        title="Detalle del pago"
        onClose={() => setDetalleAbierto(false)}
      >
        <div className="select-text space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-fg">
                {pago.descripcion}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                {metadatos}
              </p>
            </div>
            <p className="shrink-0 whitespace-nowrap text-xl font-semibold tabular-nums text-fg">
              {formatearDinero(pago.monto)}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {atrasado && (
              <Badge variant="danger" size="sm">
                <AlertTriangle className="size-3" aria-hidden />
                Atrasado
              </Badge>
            )}
            {pago.recurrente && frecuencia && (
              <Badge variant="brand" size="sm">
                <Repeat className="size-3" aria-hidden />
                {frecuencia}
              </Badge>
            )}
            {pago.domiciliado && (
              <Badge variant="neutral" size="sm">
                <Repeat className="size-3" aria-hidden />
                Domiciliado
              </Badge>
            )}
            {pago.es_tarjeta && (
              <Badge variant="neutral" size="sm">
                <CreditCard className="size-3" aria-hidden />
                Tarjeta
              </Badge>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => cerrarY(onPagar)}
            >
              <Check className="size-4" aria-hidden />
              Liquidar pago
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => cerrarY(onEditar)}
            >
              <Pencil className="size-4" aria-hidden />
              Editar
            </Button>
            {onAdelantar && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => cerrarY(onAdelantar)}
              >
                <CalendarPlus className="size-4" aria-hidden />
                Adelantar periodo
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              className="w-full"
              onClick={() => cerrarY(onEliminar)}
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
