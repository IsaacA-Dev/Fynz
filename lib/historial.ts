import type { TipoMovimiento } from './acciones'
import { aDiaNumero } from './fechas'

export type EstadoMovimiento = 'atrasado'

export interface FiltrosHistorial {
  desde: string | null
  hasta: string | null
  cuentaId: number | null
  tipo: TipoMovimiento | null
  operacion: string | null
  estado: EstadoMovimiento | null
  categoriaId: number | null
  texto: string
}

export const FILTROS_HISTORIAL_VACIOS: FiltrosHistorial = {
  desde: null,
  hasta: null,
  cuentaId: null,
  tipo: null,
  operacion: null,
  estado: null,
  categoriaId: null,
  texto: '',
}

export function enRangoFecha(
  fecha: string,
  desde: string | null,
  hasta: string | null
): boolean {
  const dia = aDiaNumero(fecha)
  if (desde && dia < aDiaNumero(desde)) return false
  if (hasta && dia > aDiaNumero(hasta)) return false
  return true
}

export function coincideTexto(texto: string, descripcion: string | null): boolean {
  const buscado = texto.trim().toLowerCase()
  if (buscado === '') return true
  return (descripcion ?? '').toLowerCase().includes(buscado)
}

export interface OpcionOperacion {
  valor: string
  etiqueta: string
}

export const OPERACIONES: OpcionOperacion[] = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'ingreso', etiqueta: 'Ingreso' },
  { valor: 'gasto', etiqueta: 'Gasto' },
  { valor: 'compra', etiqueta: 'Compra' },
  { valor: 'pago', etiqueta: 'Pago' },
  { valor: 'pago_tarjeta', etiqueta: 'Pago de tarjeta' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'ajuste', etiqueta: 'Ajuste' },
  { valor: 'movimiento', etiqueta: 'Movimiento' },
]

export const OPERACION_LABELS: Record<string, string> = Object.fromEntries(
  OPERACIONES.filter((o) => o.valor !== '').map((o) => [o.valor, o.etiqueta])
)
