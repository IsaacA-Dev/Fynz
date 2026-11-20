'use client'

import { useState } from 'react'
import { AlertTriangle, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import { esAtrasado } from '@/lib/fechas'
import {
  cuentaSugeridaChecklist,
  cuentasLiquidas,
  pagosSemanalesEnVentana,
  requiereSelectorCuenta,
} from '@/lib/checklist-semanal'
import type { Cuenta, ProximoPago } from '@/lib/acciones'

interface ChecklistSemanalProps {
  pagos: ProximoPago[]
  cuentas: Cuenta[]
  hoy: string
  onPagar: (pago: ProximoPago, cuentaId: number) => Promise<boolean>
  onEditarPago: (pago: ProximoPago) => void
  onNuevaCuenta: () => void
}

export function ChecklistSemanal({
  pagos,
  cuentas,
  hoy,
  onPagar,
  onEditarPago,
  onNuevaCuenta,
}: ChecklistSemanalProps) {
  const items = pagosSemanalesEnVentana(pagos, hoy)
  const liquidas = cuentasLiquidas(cuentas)
  const [seleccion, setSeleccion] = useState<Record<number, string>>({})
  const [pagandoId, setPagandoId] = useState<number | null>(null)

  if (items.length === 0) return null

  const marcar = async (pago: ProximoPago, cuentaId: number) => {
    if (pagandoId !== null) return
    setPagandoId(pago.proximo_pago_id)
    try {
      await onPagar(pago, cuentaId)
    } finally {
      setPagandoId(null)
    }
  }

  return (
    <Card variant="soft" className="p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-eyebrow uppercase text-fg-subtle">
            Checklist semanal
          </h3>
          <p className="text-xs text-fg-muted">
            Pagos que vencen en los próximos 2 días.
          </p>
        </div>
        <Badge variant="brand" size="sm" className="shrink-0">
          {items.length} {items.length === 1 ? 'pendiente' : 'pendientes'}
        </Badge>
      </div>

      <div className="mt-2 divide-y divide-line">
        {items.map((pago) => {
          const sugerida = cuentaSugeridaChecklist(pago, cuentas)
          const valorCuenta =
            seleccion[pago.proximo_pago_id] ??
            (sugerida != null ? String(sugerida) : '')
          const selector = requiereSelectorCuenta(pago, cuentas)
          const cuenta = liquidas.find(
            (item) => String(item.cuenta_id) === valorCuenta
          )
          const atrasado = esAtrasado(pago.fecha_vencimiento, hoy)
          const pagando = pagandoId === pago.proximo_pago_id
          const puedePagar = valorCuenta !== '' && pagandoId === null

          return (
            <div
              key={pago.proximo_pago_id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5"
            >
              <label
                className={cn(
                  'flex min-w-0 flex-1 items-start gap-3',
                  puedePagar ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                )}
              >
                <input
                  type="checkbox"
                  checked={pagando}
                  disabled={!puedePagar}
                  onChange={(evento) => {
                    if (evento.target.checked && valorCuenta !== '') {
                      void marcar(pago, Number(valorCuenta))
                    }
                  }}
                  aria-label={`Marcar ${pago.descripcion} como pagado`}
                  className="mt-0.5 size-4 shrink-0 accent-brand"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-sm font-medium',
                        atrasado ? 'text-danger' : 'text-fg'
                      )}
                    >
                      {pago.descripcion}
                    </span>
                    {atrasado && (
                      <Badge variant="danger" size="sm" className="shrink-0">
                        <AlertTriangle className="size-3" aria-hidden />
                        Atrasado
                      </Badge>
                    )}
                  </span>
                  <span
                    className={cn(
                      'block text-xs',
                      atrasado ? 'text-danger' : 'text-fg-muted'
                    )}
                  >
                    Vence {formatearFecha(pago.fecha_vencimiento)}
                    {!selector && cuenta ? ` · ${cuenta.nombre}` : ''}
                  </span>
                </span>
              </label>

              <div className="flex shrink-0 items-center gap-1">
                <p
                  className={cn(
                    'text-right text-sm font-semibold tabular-nums',
                    atrasado ? 'text-danger' : 'text-fg'
                  )}
                >
                  {formatearDinero(pago.monto)}
                </p>

                {pagando && <Spinner size="sm" label="Pagando pago semanal" />}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditarPago(pago)}
                  disabled={pagandoId !== null}
                  aria-label={`Editar ${pago.descripcion}`}
                  title="Editar pago"
                  className="size-8 shrink-0 text-fg-muted hover:bg-brand-soft hover:text-brand"
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
              </div>

              {selector && (
                <div className="w-full sm:w-44">
                  <Select
                    value={valorCuenta}
                    onChange={(evento) =>
                      setSeleccion((previos) => ({
                        ...previos,
                        [pago.proximo_pago_id]: evento.target.value,
                      }))
                    }
                    disabled={pagandoId !== null}
                    aria-label={`Cuenta para pagar ${pago.descripcion}`}
                    className="h-8 text-xs"
                  >
                    {liquidas.map((opcion) => (
                      <option
                        key={opcion.cuenta_id}
                        value={opcion.cuenta_id}
                      >
                        {opcion.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {liquidas.length === 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-panel bg-warning-soft p-3 text-xs text-warning">
          <span className="min-w-0 flex-1">
            Necesitas una cuenta de efectivo o débito para marcar estos pagos.
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onNuevaCuenta}
          >
            Nueva cuenta
          </Button>
        </div>
      )}
    </Card>
  )
}
