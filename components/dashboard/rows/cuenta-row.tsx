import { Pencil, Trash2 } from 'lucide-react'
import { formatearDinero } from '@/lib/utils/format'
import type { Cuenta } from '@/lib/acciones'
import { METODOS_ICONOS } from '@/components/dashboard/metodos'

interface CuentaRowProps {
  cuenta: Cuenta
  onEditar: () => void
  onEliminar: () => void
}

export function CuentaRow({ cuenta, onEditar, onEliminar }: CuentaRowProps) {
  const { label, Icon } = METODOS_ICONOS[cuenta.metodo]
  const subtitulo =
    cuenta.metodo === 'credito'
      ? `Crédito · Deuda${cuenta.dia_corte != null ? ` · Corte día ${cuenta.dia_corte}` : ''}`
      : label

  return (
    <div className="p-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)] truncate">
            {cuenta.nombre}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {subtitulo}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="text-right mr-1">
          <p
            className={`text-sm font-semibold ${
              cuenta.metodo === 'credito'
                ? 'text-[var(--color-danger)]'
                : 'text-[var(--color-text)]'
            }`}
          >
            {formatearDinero(cuenta.saldo)}
          </p>
          {cuenta.metodo === 'credito' && cuenta.limite != null && (
            <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
              Límite {formatearDinero(cuenta.limite)}
            </p>
          )}
        </div>
        <button
          onClick={onEditar}
          aria-label={`Editar ${cuenta.nombre}`}
          className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onEliminar}
          aria-label={`Eliminar ${cuenta.nombre}`}
          className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
