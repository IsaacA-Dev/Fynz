import { AlertTriangle, Check, CreditCard, Pencil, Repeat, Trash2 } from 'lucide-react'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { ProximoPago, Vista } from '@/lib/acciones'

interface PagoRowProps {
  pago: ProximoPago
  ahora: number
  modo: Vista
  onEditar: () => void
  onEliminar: () => void
  onPagar: () => void
}

function Badges({ pago, atrasado }: { pago: ProximoPago; atrasado: boolean }) {
  return (
    <>
      {atrasado && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] shrink-0">
          <AlertTriangle className="w-3 h-3" />
          Atrasado
        </span>
      )}
      {pago.recurrente && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] shrink-0">
          <Repeat className="w-3 h-3" />
          {pago.dia_cobro != null ? `Repite día ${pago.dia_cobro}` : 'Repite'}
        </span>
      )}
      {pago.domiciliado && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-warning-soft)] text-[var(--color-warning)] shrink-0">
          <Repeat className="w-3 h-3" />
          Domiciliado
        </span>
      )}
      {pago.es_tarjeta && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] shrink-0">
          <CreditCard className="w-3 h-3" />
          Tarjeta
        </span>
      )}
    </>
  )
}

export function PagoRow({ pago, ahora, modo, onEditar, onEliminar, onPagar }: PagoRowProps) {
  const atrasado = !pago.pagado && new Date(pago.fecha_vencimiento).getTime() < ahora
  const escritorio = modo === 'escritorio'

  return (
    <div className={`space-y-2 ${escritorio ? 'p-4' : 'py-3 px-4'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              atrasado ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'
            }`}
          >
            {pago.descripcion}
          </p>
          <span
            className={`text-xs shrink-0 ${
              atrasado
                ? 'text-[var(--color-danger)] font-medium'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            {formatearFecha(pago.fecha_vencimiento)}
          </span>
        </div>
        <p
          className={`text-sm font-semibold shrink-0 ${
            atrasado ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'
          }`}
        >
          {formatearDinero(pago.monto)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
          <Badges pago={pago} atrasado={atrasado} />
        </div>

        <div className={`flex items-center shrink-0 ${escritorio ? 'gap-0.5' : 'gap-1'}`}>
          <button
            onClick={onEditar}
            aria-label="Editar pago"
            className={`rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors ${
              escritorio ? 'p-1.5' : 'p-2'
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onEliminar}
            aria-label="Eliminar pago"
            className={`rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors ${
              escritorio ? 'p-1.5' : 'p-2'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onPagar}
            className={`bg-[var(--color-primary)] text-white text-xs font-medium rounded-full flex items-center gap-1 hover:bg-[var(--color-primary-hover)] transition-colors ${
              escritorio ? 'px-2.5 py-1.5' : 'px-3 py-1.5'
            }`}
          >
            <Check className="w-3 h-3" />
            Pagar
          </button>
        </div>
      </div>
    </div>
  )
}
