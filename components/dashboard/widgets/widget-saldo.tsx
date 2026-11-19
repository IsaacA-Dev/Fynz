'use client'

import { useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import { Badge } from '@/components/ui/badge'
import { formatearDinero } from '@/lib/utils/format'
import { filtrarCuentasPorMetodo } from '@/lib/tablero'
import type { WidgetProps } from './registry'

export function WidgetSaldoPorCuenta({ datos, filtros }: WidgetProps) {
  const { animar, reducirMovimiento } = useAnime()
  const contenedorRef = useRef<HTMLDivElement | null>(null)

  const cuentas = filtrarCuentasPorMetodo(datos.cuentas, filtros.metodo)
  const maxAbs = Math.max(...cuentas.map((c) => Math.abs(c.saldo)), 1)

  useLayoutEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor || reducirMovimiento) return
    const barras = Array.from(contenedor.querySelectorAll<HTMLElement>('[data-barra]'))
    if (barras.length === 0) return

    animar(barras, {
      duracion: 'normal',
      scaleX: [0, 1],
      delay: (_: unknown, indice: number) => 100 + indice * 60,
    })
  }, [animar, reducirMovimiento])

  return (
    <div className="space-y-3" ref={contenedorRef}>
      {cuentas.length === 0 ? (
        <p className="text-xs text-fg-muted">
          Sin cuentas para mostrar en este filtro.
        </p>
      ) : (
        cuentas.map((cuenta) => {
          const esDeuda = cuenta.metodo === 'credito'
          const pct = Math.max((Math.abs(cuenta.saldo) / maxAbs) * 100, 2)
          return (
            <div key={cuenta.cuenta_id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-fg @lg:text-sm">
                    {cuenta.nombre}
                  </span>
                  {esDeuda && (
                    <Badge variant="danger" size="sm">
                      Deuda
                    </Badge>
                  )}
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold @lg:text-sm ${
                    esDeuda ? 'text-danger' : 'text-fg'
                  }`}
                >
                  {formatearDinero(cuenta.saldo)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line @lg:h-2.5">
                <div
                  data-barra
                  className={`h-full rounded-full ${
                    esDeuda ? 'bg-danger' : 'bg-brand'
                  }`}
                  style={{ width: `${pct}%`, transformOrigin: 'left' }}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
