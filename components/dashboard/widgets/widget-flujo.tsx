'use client'

import { useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import { formatearDinero } from '@/lib/utils/format'
import type { WidgetProps } from './registry'

const ALTO_BARRA = 96

export function WidgetFlujoMensual({ datos, filtros }: WidgetProps) {
  const { animar, reducirMovimiento } = useAnime()
  const contenedorRef = useRef<HTMLDivElement | null>(null)

  const meses = datos.flujoMensual.slice(-filtros.meses)
  const valorMax = Math.max(
    ...meses.flatMap((m) => [m.ingresos, m.egresos]),
    1
  )

  useLayoutEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor || reducirMovimiento) return
    const barras = Array.from(contenedor.querySelectorAll<HTMLElement>('[data-flujo]'))
    if (barras.length === 0) return

    animar(barras, {
      duracion: 'rapida',
      scaleY: [0, 1],
      delay: (_: unknown, indice: number) => 80 + indice * 45,
    })
  }, [animar, reducirMovimiento])

  const etiquetaMes = (clave: string) =>
    new Date(Number(clave.slice(0, 4)), Number(clave.slice(5, 7)) - 1, 1).toLocaleDateString(
      'es-MX',
      { month: 'short' }
    )

  return (
    <div className="space-y-2" ref={contenedorRef}>
      <div className="flex justify-end gap-3 text-[10px] @lg:text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" /> Ingresos
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" /> Gastos
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {meses.map((mes) => (
          <div key={mes.mes} className="flex flex-col items-center gap-1">
            <div className="flex items-end gap-1" style={{ height: ALTO_BARRA }}>
              <div
                data-flujo
                title={`Ingresos ${formatearDinero(mes.ingresos)}`}
                className="w-3 rounded-t bg-[var(--color-success)]"
                style={{
                  height: Math.max((mes.ingresos / valorMax) * ALTO_BARRA, mes.ingresos > 0 ? 4 : 0),
                  transformOrigin: 'bottom',
                }}
              />
              <div
                data-flujo
                title={`Gastos ${formatearDinero(mes.egresos)}`}
                className="w-3 rounded-t bg-[var(--color-text-muted)]"
                style={{
                  height: Math.max((mes.egresos / valorMax) * ALTO_BARRA, mes.egresos > 0 ? 4 : 0),
                  transformOrigin: 'bottom',
                }}
              />
            </div>
            <span className="text-[10px] @lg:text-xs text-[var(--color-text-muted)]">
              {etiquetaMes(mes.mes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
