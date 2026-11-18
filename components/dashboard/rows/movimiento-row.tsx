import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { OPERACION_LABELS } from '@/lib/historial'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { MovimientoLista } from '@/lib/acciones'

interface MovimientoRowProps {
  movimiento: MovimientoLista
  onVer?: () => void
}

export function MovimientoRow({ movimiento, onVer }: MovimientoRowProps) {
  const esIngreso = movimiento.tipo === 'ingreso'
  const etiquetaOp =
    movimiento.operacion != null ? OPERACION_LABELS[movimiento.operacion] ?? null : null

  return (
    <button
      type="button"
      onClick={onVer}
      disabled={!onVer}
      className={`p-4 flex items-center justify-between gap-3 w-full text-left transition-colors ${
        onVer
          ? 'hover:bg-[var(--color-background)] cursor-pointer'
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-9 h-9 @lg:w-11 @lg:h-11 rounded-full flex items-center justify-center shrink-0 ${
            esIngreso
              ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
              : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
          }`}
        >
          {esIngreso ? (
            <ArrowDownLeft className="w-4 h-4 @lg:w-5 @lg:h-5" />
          ) : (
            <ArrowUpRight className="w-4 h-4 @lg:w-5 @lg:h-5" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)] truncate flex items-center gap-1.5 @lg:text-base">
            {movimiento.descripcion ?? (esIngreso ? 'Ingreso' : 'Egreso')}
            {etiquetaOp && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] shrink-0">
                {etiquetaOp}
              </span>
            )}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] @lg:text-sm">
            {movimiento.cuenta_nombre} · {formatearFecha(movimiento.fecha)}
          </p>
        </div>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold @lg:text-base ${
          esIngreso ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'
        }`}
      >
        {esIngreso ? '+' : '-'}
        {formatearDinero(movimiento.monto)}
      </p>
    </button>
  )
}
