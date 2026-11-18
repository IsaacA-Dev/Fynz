'use client'

import { aCentavos } from '@/lib/dinero'
import { esAnteriorOIgual, sumarDias, hoyLocal } from '@/lib/fechas'
import { formatearDinero } from '@/lib/utils/format'
import type { WidgetProps } from './registry'

export function WidgetPromedioDiario({ datos, filtros }: WidgetProps) {
  const diasWindow = filtros.meses === 1 ? 30 : filtros.meses === 3 ? 90 : 180
  const hoy = hoyLocal()
  const desde = sumarDias(hoy, -diasWindow)

  let gastos = 0
  let conMovimientos = false
  for (const movimiento of datos.movimientosAnalitica) {
    if (movimiento.tipo !== 'egreso') continue
    if (esAnteriorOIgual(movimiento.fecha, desde)) continue
    conMovimientos = true
    gastos += aCentavos(movimiento.monto)
  }

  if (!conMovimientos) {
    return (
      <p className="text-sm text-[var(--color-text-muted)] py-2">
        Sin gastos en los últimos {diasWindow} días.
      </p>
    )
  }

  const promedio = Math.round(gastos / diasWindow)
  const liquido = aCentavos(datos.dineroLiquido)
  const diasCubiertos = promedio > 0 ? Math.floor(liquido / promedio) : null

  return (
    <div className="space-y-1">
      <p className="text-sm text-[var(--color-text-muted)] @lg:text-base">
        Gastas en promedio{' '}
        <strong className="text-[var(--color-text)]">{formatearDinero(promedio)}</strong> al
        día (últimos {diasWindow} días).
      </p>
      {diasCubiertos != null && (
        <p className="text-xs text-[var(--color-text-muted)] @lg:text-sm">
          A ese ritmo, tu liquidez actual cubre ~
          <strong className="text-[var(--color-text)]"> {diasCubiertos} días</strong>
          {diasCubiertos < 30 && (
            <span className="text-[var(--color-warning)]"> — es buen momento de ajustar.</span>
          )}
          .
        </p>
      )}
    </div>
  )
}
