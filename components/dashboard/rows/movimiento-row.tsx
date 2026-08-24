import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { MovimientoLista } from '@/lib/acciones'

export function MovimientoRow({ movimiento }: { movimiento: MovimientoLista }) {
  const esIngreso = movimiento.tipo === 'ingreso'

  return (
    <div className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            esIngreso
              ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
              : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
          }`}
        >
          {esIngreso ? (
            <ArrowDownLeft className="w-4 h-4" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)] truncate">
            {movimiento.descripcion ?? (esIngreso ? 'Ingreso' : 'Egreso')}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {movimiento.cuenta_nombre} · {formatearFecha(movimiento.fecha)}
          </p>
        </div>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold ${
          esIngreso ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'
        }`}
      >
        {esIngreso ? '+' : '-'}
        {formatearDinero(movimiento.monto)}
      </p>
    </div>
  )
}
