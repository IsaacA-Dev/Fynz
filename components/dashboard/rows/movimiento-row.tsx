import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OPERACION_LABELS } from '@/lib/historial'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { MovimientoLista } from '@/lib/acciones'

interface MovimientoRowProps {
  movimiento: MovimientoLista
  onVer?: () => void
}

export function MovimientoRow({ movimiento, onVer }: MovimientoRowProps) {
  const esIngreso = movimiento.tipo === 'ingreso'
  const etiquetaOp =
    movimiento.operacion != null
      ? (OPERACION_LABELS[movimiento.operacion] ?? null)
      : null

  const contenido = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full @lg:size-11',
            esIngreso
              ? 'bg-success-soft text-success'
              : 'bg-surface-muted text-fg-muted'
          )}
        >
          {esIngreso ? (
            <ArrowDownLeft className="size-4 @lg:size-5" aria-hidden />
          ) : (
            <ArrowUpRight className="size-4 @lg:size-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium text-fg @lg:text-base">
              {movimiento.descripcion ?? (esIngreso ? 'Ingreso' : 'Egreso')}
            </p>
            {etiquetaOp && (
              <Badge variant="neutral" size="sm">
                {etiquetaOp}
              </Badge>
            )}
          </div>
          <p className="text-xs text-fg-muted @lg:text-sm">
            {movimiento.cuenta_nombre} · {formatearFecha(movimiento.fecha)}
          </p>
        </div>
      </div>
      <p
        className={cn(
          'shrink-0 text-sm font-semibold @lg:text-base',
          esIngreso ? 'text-success' : 'text-fg'
        )}
      >
        {esIngreso ? '+' : '-'}
        {formatearDinero(movimiento.monto)}
      </p>
    </>
  )

  if (onVer) {
    return (
      <button
        type="button"
        onClick={onVer}
        className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
      >
        {contenido}
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      {contenido}
    </div>
  )
}
