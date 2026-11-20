import {
  AlertTriangle,
  CalendarPlus,
  Check,
  CreditCard,
  Pencil,
  Repeat,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import { esAtrasado } from '@/lib/fechas'
import { etiquetaFrecuencia } from '@/lib/recurrencia'
import type { ProximoPago, Vista } from '@/lib/acciones'

interface PagoRowProps {
  pago: ProximoPago
  hoy: string
  modo: Vista
  onEditar: () => void
  onEliminar: () => void
  onPagar: () => void
  onAdelantar?: () => void
}

export function PagoRow({
  pago,
  hoy,
  modo,
  onEditar,
  onEliminar,
  onPagar,
  onAdelantar,
}: PagoRowProps) {
  const atrasado = !pago.pagado && esAtrasado(pago.fecha_vencimiento, hoy)
  const escritorio = modo === 'escritorio'

  return (
    <div className="space-y-2 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p
              className={cn(
                'min-w-0 flex-1 truncate text-sm font-medium @lg:text-base',
                atrasado ? 'text-danger' : 'text-fg'
              )}
            >
              {pago.descripcion}
            </p>
            {atrasado && (
              <Badge variant="danger" size="sm" className="shrink-0">
                <AlertTriangle className="size-3" aria-hidden />
                Atrasado
              </Badge>
            )}
          </div>
          <p
            className={cn(
              'truncate text-xs @lg:text-sm',
              atrasado ? 'text-danger' : 'text-fg-muted'
            )}
          >
            Vence {formatearFecha(pago.fecha_vencimiento)}
            {pago.domiciliado && pago.cuenta_nombre
              ? ` · ${pago.cuenta_nombre}`
              : ''}
          </p>
        </div>
        <p
          className={cn(
            'shrink-0 text-right text-sm font-semibold tabular-nums @lg:text-base',
            atrasado ? 'text-danger' : 'text-fg'
          )}
        >
          {formatearDinero(pago.monto)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {pago.recurrente && (
            <Badge variant="brand" size="sm" className="shrink-0">
              <Repeat className="size-3" aria-hidden />
              {etiquetaFrecuencia(pago.frecuencia, pago.dia_cobro)}
            </Badge>
          )}
          {pago.domiciliado && (
            <Badge variant="neutral" size="sm" className="shrink-0">
              <Repeat className="size-3" aria-hidden />
              Domiciliado
            </Badge>
          )}
          {pago.es_tarjeta && (
            <Badge variant="neutral" size="sm" className="shrink-0">
              <CreditCard className="size-3" aria-hidden />
              Tarjeta
            </Badge>
          )}
        </div>

        <div
          className={cn(
            'ml-auto flex shrink-0 items-center',
            escritorio ? 'gap-0.5' : 'gap-1'
          )}
        >
          {onAdelantar && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onAdelantar}
              aria-label={`Adelantar siguiente periodo de ${pago.descripcion}`}
              title="Adelantar siguiente periodo"
              className="size-8 text-fg-muted hover:bg-brand-soft hover:text-brand"
            >
              <CalendarPlus className="size-4" aria-hidden />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEditar}
            aria-label={`Editar ${pago.descripcion}`}
            className="size-8 text-fg-muted hover:bg-brand-soft hover:text-brand"
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEliminar}
            aria-label={`Eliminar ${pago.descripcion}`}
            className="size-8 text-fg-muted hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onPagar}
            aria-label={`Pagar ${pago.descripcion}`}
            className="ml-1"
          >
            <Check className="size-3.5" aria-hidden />
            Pagar
          </Button>
        </div>
      </div>
    </div>
  )
}
