import { formatearCentavos } from '@/lib/dinero'
import { descomponer } from '@/lib/fechas'

export function formatearDinero(centavos: number): string {
  return `$${formatearCentavos(centavos)}`
}

const MESES_LARGOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

export function formatearFecha(fecha: string): string {
  const partes = descomponer(fecha.trim().slice(0, 10))
  if (!partes) return fecha
  return `${partes.dia} ${MESES_LARGOS[partes.mes - 1]}`
}

export function formatearFechaLarga(fecha: string): string {
  const partes = descomponer(fecha.trim().slice(0, 10))
  if (!partes) return fecha
  return `${partes.dia} ${MESES_LARGOS[partes.mes - 1]} ${partes.anio}`
}
