'use client'

import { useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import { claveMes } from '@/lib/fechas'
import { formatearDinero } from '@/lib/utils/format'
import { aCentavos } from '@/lib/dinero'
import type { WidgetProps } from './registry'

const COLORES = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

function colorCategoria(nombre: string, indice: number): string {
  if (nombre === 'Sin categoría') return 'var(--color-fg-subtle)'
  return COLORES[indice % COLORES.length]
}

export function WidgetGastosCategoria({ datos, filtros }: WidgetProps) {
  const { animar, reducirMovimiento } = useAnime()
  const contenedorRef = useRef<HTMLDivElement | null>(null)

  const porCategoria = new Map<string, number>()
  let sinCategoria = 0

  const desde = mesHaceKey(filtros.meses)

  for (const movimiento of datos.movimientosAnalitica) {
    if (movimiento.tipo !== 'egreso') continue
    const clave = claveMes(movimiento.fecha)
    if (!clave || clave < desde) continue
    const monto = aCentavos(movimiento.monto)
    if (movimiento.categoria_id != null) {
      const nombre = datos.categorias[String(movimiento.categoria_id)] ?? 'Otra'
      porCategoria.set(nombre, (porCategoria.get(nombre) ?? 0) + monto)
    } else {
      sinCategoria += monto
    }
  }

  if (sinCategoria > 0) {
    porCategoria.set('Sin categoría', (porCategoria.get('Sin categoría') ?? 0) + sinCategoria)
  }

  const entradas = [...porCategoria.entries()].sort((a, b) => b[1] - a[1])
  const total = entradas.reduce((suma, [, monto]) => suma + monto, 0)

  useLayoutEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor || reducirMovimiento) return
    const barras = Array.from(contenedor.querySelectorAll<HTMLElement>('[data-cat]'))
    if (barras.length === 0) return
    animar(barras, {
      duracion: 'rapida',
      scaleX: [0, 1],
      delay: (_: unknown, indice: number) => 60 + indice * 50,
    })
  }, [animar, reducirMovimiento])

  if (entradas.length === 0) {
    return (
      <p className="py-2 text-sm text-fg-muted">
        Aún no hay gastos registrados con categoría.
      </p>
    )
  }

  const maximo = Math.max(...entradas.map(([, monto]) => monto), 1)

  return (
    <div className="space-y-2" ref={contenedorRef}>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-fg-muted @lg:text-xs">
        {entradas.map(([nombre], indice) => (
          <span key={nombre} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colorCategoria(nombre, indice) }}
            />
            {nombre}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        {entradas.map(([nombre, monto], indice) => (
          <div key={nombre} className="flex items-center gap-2 text-sm">
            <span className="w-28 shrink-0 truncate text-xs text-fg-muted @lg:text-sm">
              {nombre}
            </span>
            <div
              data-cat
              className="h-2.5 rounded-full flex-1 max-w-xs"
              style={{
                width: `${Math.max((monto / maximo) * 100, 4)}%`,
                backgroundColor: colorCategoria(nombre, indice),
                transformOrigin: 'left',
              }}
            />
            <span className="ml-auto text-sm font-medium text-fg">
              {formatearDinero(monto)}
            </span>
          </div>
        ))}
      </div>

      <p className="pt-1 text-[10px] text-fg-muted @lg:text-xs">
        Total {formatearDinero(total)} en el periodo.
      </p>
    </div>
  )
}

function mesHaceKey(meses: number): string {
  const ahora = new Date()
  const indice = ahora.getFullYear() * 12 + ahora.getMonth() - (meses - 1)
  const anio = Math.floor(indice / 12)
  const mes = (indice % 12) + 1
  return `${anio}-${String(mes).padStart(2, '0')}`
}
