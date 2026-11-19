import { siguienteDiaCobro, sumarDias } from './fechas'

/**
 * Frecuencias de los compromisos.
 *
 * - unico: un solo vencimiento.
 * - semanal: el siguiente periodo suma 7 días.
 * - quincenal: el siguiente periodo suma 14 días.
 * - mensual: se conserva el día de cobro y se ajusta en meses cortos.
 */
export type Frecuencia = 'unico' | 'semanal' | 'quincenal' | 'mensual'

export const FRECUENCIAS: Array<{
  valor: Frecuencia
  etiqueta: string
  ayuda: string
}> = [
  {
    valor: 'unico',
    etiqueta: 'Único',
    ayuda: 'Un solo vencimiento.',
  },
  {
    valor: 'semanal',
    etiqueta: 'Semanal',
    ayuda: 'El siguiente periodo se calcula sumando 7 días.',
  },
  {
    valor: 'quincenal',
    etiqueta: 'Quincenal',
    ayuda: 'El siguiente periodo se calcula sumando 14 días.',
  },
  {
    valor: 'mensual',
    etiqueta: 'Mensual',
    ayuda: 'Se repite el mismo día de cada mes.',
  },
]

export function esFrecuencia(valor: unknown): valor is Frecuencia {
  return (
    valor === 'unico' ||
    valor === 'semanal' ||
    valor === 'quincenal' ||
    valor === 'mensual'
  )
}

export function esRecurrente(frecuencia: Frecuencia): boolean {
  return frecuencia !== 'unico'
}

export function siguienteVencimiento(
  frecuencia: Frecuencia,
  diaCobro: number | null,
  fecha: string
): string | null {
  if (frecuencia === 'unico') return null
  if (frecuencia === 'semanal') return sumarDias(fecha, 7)
  if (frecuencia === 'quincenal') return sumarDias(fecha, 14)
  return siguienteDiaCobro(diaCobro ?? 0, sumarDias(fecha, 1))
}

export function fechaInicialPago(opciones: {
  frecuencia: Frecuencia
  fechaVencimiento?: string | null
  diaCobro?: number | null
  hoy: string
  reprogramarFecha?: string | null
}): string {
  const reprogramada = opciones.reprogramarFecha?.slice(0, 10)
  if (reprogramada) return reprogramada

  if (opciones.frecuencia === 'mensual') {
    return siguienteDiaCobro(opciones.diaCobro ?? 0, opciones.hoy)
  }

  return (opciones.fechaVencimiento ?? '').slice(0, 10)
}

export function etiquetaFrecuencia(
  frecuencia: Frecuencia,
  diaCobro: number | null
): string {
  if (frecuencia === 'semanal') return 'Cada semana'
  if (frecuencia === 'quincenal') return 'Cada 2 semanas'
  if (frecuencia === 'mensual') {
    return diaCobro != null ? `Repite día ${diaCobro}` : 'Mensual'
  }
  return 'Único'
}
