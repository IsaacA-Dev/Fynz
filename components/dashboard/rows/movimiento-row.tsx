import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OPERACION_LABELS } from '@/lib/historial'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { MovimientoLista } from '@/lib/acciones'

interface MovimientoRowProps {
  movimiento: MovimientoLista
  categoria?: string | null
  onVer?: () => void
}

export function MovimientoRow({
  movimiento,
  categoria,
  onVer,
}: MovimientoRowProps) {
  const esIngreso = movimiento.tipo === 'ingreso'
  const etiquetaOp =
    movimiento.operacion != null
      ? (OPERACION_LABELS[movimiento.operacion] ?? null)
      : null
  const categoriaVisible = categoria?.trim() || null

  const contenido = (
    <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full @lg:size-11',
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
        <p className="truncate text-sm font-medium text-fg @lg:text-base">
          {movimiento.descripcion ?? (esIngreso ? 'Ingreso' : 'Egreso')}
        </p>
        <p className="truncate text-xs text-fg-muted @lg:text-sm">
          {movimiento.cuenta_nombre} · {formatearFecha(movimiento.fecha)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'whitespace-nowrap text-sm font-semibold tabular-nums @lg:text-base',
            esIngreso ? 'text-success' : 'text-fg'
          )}
        >
          {esIngreso ? '+' : '-'}
          {formatearDinero(movimiento.monto)}
        </p>

        {onVer ? (
          <span className="mt-0.5 flex max-w-[7.5rem] items-center justify-end gap-0.5 text-[11px] text-fg-subtle">
            {categoriaVisible && (
              <span className="truncate">{categoriaVisible}</span>
            )}
            <ChevronRight className="size-3 shrink-0" aria-hidden />
          </span>
        ) : categoriaVisible ? (
          <p className="mt-0.5 max-w-[7.5rem] truncate text-[11px] text-fg-subtle">
            {categoriaVisible}
          </p>
        ) : etiquetaOp ? (
          <Badge
            variant="neutral"
            size="sm"
            className="mt-0.5 shrink-0"
          >
            {etiquetaOp}
          </Badge>
        ) : (
          <span className="mt-0.5 block h-4" aria-hidden />
        )}
      </div>
    </div>
  )

  if (onVer) {
    return (
      <button
        type="button"
        onClick={onVer}
        className="w-full min-h-[4.5rem] select-none py-3 text-left transition-transform duration-100 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80 active:scale-[0.99]"
      >
        {contenido}
      </button>
    )
  }

  return <div className="min-h-[4.5rem] select-none py-3">{contenido}</div>
}
