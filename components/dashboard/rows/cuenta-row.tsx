import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { creditoDisponible } from '@/lib/logica-financiera'
import { cn } from '@/lib/utils/cn'
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
  const esCredito = cuenta.metodo === 'credito'
  const subtitulo = esCredito
    ? `Deuda${cuenta.dia_corte != null ? ` · Corte día ${cuenta.dia_corte}` : ''}`
    : label

  const disponible = esCredito
    ? creditoDisponible(cuenta.limite, cuenta.saldo)
    : null

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full @lg:size-11',
            esCredito
              ? 'bg-danger-soft text-danger'
              : 'bg-brand-soft text-brand'
          )}
        >
          <Icon className="size-4 @lg:size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-fg @lg:text-base">
              {cuenta.nombre}
            </p>
            {esCredito && (
              <Badge variant="danger" size="sm">
                Crédito
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-fg-muted @lg:text-sm">
            {subtitulo}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1">
        <div className="mr-1 min-w-0 text-right">
          <p
            className={cn(
              'text-sm font-semibold @lg:text-base',
              esCredito ? 'text-danger' : 'text-fg'
            )}
          >
            {formatearDinero(cuenta.saldo)}
          </p>
          {esCredito && cuenta.limite != null && (
            <p className="max-w-[9.5rem] break-words text-[11px] leading-tight text-fg-muted @lg:max-w-[12rem] @lg:text-xs">
              Límite {formatearDinero(cuenta.limite)}
              {disponible != null
                ? ` · Crédito disponible ${formatearDinero(disponible)}`
                : ''}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEditar}
          aria-label={`Editar ${cuenta.nombre}`}
          className="size-9 text-fg-muted hover:bg-brand-soft hover:text-brand"
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEliminar}
          aria-label={`Eliminar ${cuenta.nombre}`}
          className="size-9 text-fg-muted hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
