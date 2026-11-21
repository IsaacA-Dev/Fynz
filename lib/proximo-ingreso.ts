import { descomponer, diasEntre, sumarDias } from './fechas'

export const FRECUENCIAS_PROXIMO_INGRESO = [
  { valor: 'unica', etiqueta: 'Una vez', dias: null },
  { valor: 'semanal', etiqueta: 'Semanal', dias: 7 },
  { valor: 'quincenal', etiqueta: 'Quincenal', dias: 14 },
] as const

export type FrecuenciaProximoIngreso =
  (typeof FRECUENCIAS_PROXIMO_INGRESO)[number]['valor']

export function esFrecuenciaProximoIngreso(
  valor: unknown
): valor is FrecuenciaProximoIngreso {
  return FRECUENCIAS_PROXIMO_INGRESO.some(
    (opcion) => opcion.valor === valor
  )
}

export function etiquetaFrecuenciaProximoIngreso(
  frecuencia: FrecuenciaProximoIngreso
): string {
  return (
    FRECUENCIAS_PROXIMO_INGRESO.find(
      (opcion) => opcion.valor === frecuencia
    )?.etiqueta ?? 'Una vez'
  )
}

/**
 * Calcula la próxima ocurrencia de la fecha de ingreso para el horizonte Auto.
 *
 * - Una vez: conserva la fecha tal como fue guardada.
 * - Semanal: suma 7 días hasta que la fecha sea hoy o posterior.
 * - Quincenal: suma 14 días hasta que la fecha sea hoy o posterior.
 *
 * No modifica saldos ni crea ingresos: solo ajusta la fecha de corte.
 */
export function siguienteFechaProximoIngreso(
  fecha: string | null,
  frecuencia: FrecuenciaProximoIngreso,
  hoy: string
): string | null {
  if (!fecha || !descomponer(fecha)) return null

  const fechaNormalizada = fecha.trim().slice(0, 10)
  if (frecuencia === 'unica') return fechaNormalizada

  const opcion = FRECUENCIAS_PROXIMO_INGRESO.find(
    (item) => item.valor === frecuencia
  )
  const paso = opcion?.dias
  if (!paso) return fechaNormalizada

  const diasHastaHoy = diasEntre(fechaNormalizada, hoy)
  if (diasHastaHoy <= 0) return fechaNormalizada

  const pasos = Math.ceil(diasHastaHoy / paso)
  return sumarDias(fechaNormalizada, pasos * paso)
}
