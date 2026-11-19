'use client'

import { formatearDinero } from '@/lib/utils/format'
import { aCentavos } from '@/lib/dinero'
import type { WidgetProps } from './registry'

const PALETA = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export function WidgetDistribucionSaldos({ datos }: WidgetProps) {
  const liquidas = datos.cuentas.filter(
    (c) => c.metodo !== 'credito' && aCentavos(c.saldo) > 0
  )
  const deuda = datos.cuentas
    .filter((c) => c.metodo === 'credito')
    .reduce((suma, c) => suma + aCentavos(c.saldo), 0)

  const total = liquidas.reduce((suma, c) => suma + aCentavos(c.saldo), 0)

  if (total === 0) {
    return (
      <p className="py-2 text-sm text-fg-muted">
        Sin dinero líquido en este momento.
      </p>
    )
  }

  const montos = liquidas.map((cuenta) => aCentavos(cuenta.saldo))
  const segmentos = liquidas.map((cuenta, indice) => {
    const monto = montos[indice]
    const desde = montos.slice(0, indice).reduce((suma, m) => suma + m, 0)
    return {
      nombre: cuenta.nombre,
      monto,
      color: PALETA[indice % PALETA.length],
      desde,
      porcentaje: (monto / total) * 100,
    }
  })

  const radio = 44
  const circunferencia = 2 * Math.PI * radio

  // Padding de seguridad: los wraps de la dona no se ocultan entre sí.
  const OFFSET = 3

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-28 h-28 @lg:w-36 @lg:h-36 shrink-0 -rotate-90" role="img" aria-label="Distribución de saldos">
        <circle cx="60" cy="60" r={radio} fill="none" stroke="var(--color-line)" strokeWidth="14" />
        {segmentos.map((segmento) => (
          <circle
            key={segmento.nombre}
            cx="60"
            cy="60"
            r={radio}
            fill="none"
            stroke={segmento.color}
            strokeWidth="14"
            strokeDasharray={`${Math.max((segmento.porcentaje / 100) * circunferencia - OFFSET, 2)} ${circunferencia}`}
            strokeDashoffset={-((segmento.desde / total) * circunferencia)}
          />
        ))}
      </svg>

      <div className="space-y-1 min-w-0">
        {segmentos.map((segmento) => (
          <div key={segmento.nombre} className="flex items-center gap-2 text-xs @lg:text-sm">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: segmento.color }} />
            <span className="truncate text-fg-muted">{segmento.nombre}</span>
            <span className="ml-auto shrink-0 font-medium text-fg">
              {formatearDinero(segmento.monto)}
            </span>
          </div>
        ))}
        {deuda > 0 && (
          <p className="pt-1 text-[10px] text-danger">
            Deuda en tarjetas: {formatearDinero(deuda)} (no es dinero tuyo).
          </p>
        )}
      </div>
    </div>
  )
}
