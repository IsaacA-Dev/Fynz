'use client'

import { useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import { formatearDinero } from '@/lib/utils/format'
import { cargaAcumulada, filtrarPagosPorHorizonte, pagoMayor } from '@/lib/tablero'
import type { WidgetProps } from './registry'

export function WidgetCargaPagos({ datos, filtros }: WidgetProps) {
  const { animar, reducirMovimiento } = useAnime()
  const contenedorRef = useRef<HTMLDivElement | null>(null)

  const pagos = filtrarPagosPorHorizonte(datos.pagos, filtros.horizonte)
  const puntos = cargaAcumulada(pagos)
  const mayor = pagoMayor(pagos)

  const maxAcumulado = Math.max(...puntos.map((p) => p.acumulado), 1)
  const total = puntos.length > 0 ? puntos[puntos.length - 1].acumulado : 0

  const puntosSvg = puntos
    .map((punto, indice) => {
      const x = puntos.length === 1 ? 50 : (indice / (puntos.length - 1)) * 100
      const y = 38 - (punto.acumulado / maxAcumulado) * 34
      return `${x},${y}`
    })
    .join(' ')

  useLayoutEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor || reducirMovimiento) return
    const marcadores = Array.from(contenedor.querySelectorAll<SVGCircleElement>('[data-punto]'))
    if (marcadores.length === 0) return

    animar(marcadores, {
      duracion: 'rapida',
      opacity: [0, 1],
      r: [0.2, 1.6],
      delay: (_: unknown, indice: number) => 100 + indice * 60,
    })
  }, [animar, reducirMovimiento])

  if (puntos.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">
        {filtros.horizonte != null
          ? `Sin pagos pendientes en los próximos ${filtros.horizonte} días.`
          : 'Sin pagos pendientes.'}
      </p>
    )
  }

  return (
    <div className="space-y-2" ref={contenedorRef}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-24 @lg:h-32">
        <polyline
          points={puntosSvg}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {puntos.map((punto, indice) => {
          const x = puntos.length === 1 ? 50 : (indice / (puntos.length - 1)) * 100
          const y = 38 - (punto.acumulado / maxAcumulado) * 34
          return (
            <circle
              key={`${punto.fecha}-${indice}`}
              data-punto
              cx={x}
              cy={y}
              r="1.6"
              fill="var(--color-primary)"
              style={{ opacity: 0 }}
            />
          )
        })}
      </svg>

      <div className="flex items-center justify-between gap-2 text-xs @lg:text-sm">
        <span className="font-semibold text-[var(--color-text)]">
          Total {formatearDinero(total)}
        </span>
        {mayor && (
          <span className="text-[var(--color-text-muted)] truncate">
            Mayor: {mayor.descripcion} · {formatearDinero(mayor.monto)}
          </span>
        )}
      </div>
    </div>
  )
}
