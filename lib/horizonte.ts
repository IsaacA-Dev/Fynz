import type { Cuenta, ProximoPago } from './acciones'
import { aCentavos } from './dinero'
import { esAtrasado, esAnteriorOIgual, formatearFecha, hoyLocal, sumarDias } from './fechas'

export type TipoHorizonte = 'ingreso' | 'dias' | 'fecha'

export interface Horizonte {
  tipo: TipoHorizonte
  dias: number | null
  fechaLimite: string
  etiqueta: string
  preferido: number | null
  preferidoFecha: string | null
}

export interface OpcionesHorizonte {
  proximoIngreso: string | null
  preferido: number | null
  preferidoFecha: string | null
}

export const HORIZONTE_POR_DEFECTO_DIAS = 30

export function calcularHorizonte(
  opciones: OpcionesHorizonte,
  hoy = hoyLocal()
): Horizonte {
  const preferido = opciones.preferido != null && opciones.preferido > 0 ? opciones.preferido : null
  const preferidoFecha =
    opciones.preferidoFecha && opciones.preferidoFecha.length >= 10
      ? opciones.preferidoFecha.slice(0, 10)
      : null

  if (preferidoFecha) {
    return {
      tipo: 'fecha',
      dias: null,
      fechaLimite: preferidoFecha,
      etiqueta: `hasta el ${formatearFecha(preferidoFecha)}`,
      preferido,
      preferidoFecha,
    }
  }

  if (preferido) {
    return {
      tipo: 'dias',
      dias: preferido,
      fechaLimite: sumarDias(hoy, preferido),
      etiqueta: `durante los próximos ${preferido} días`,
      preferido,
      preferidoFecha: null,
    }
  }

  if (opciones.proximoIngreso && opciones.proximoIngreso.length >= 10) {
    const fecha = opciones.proximoIngreso.slice(0, 10)
    return {
      tipo: 'ingreso',
      dias: null,
      fechaLimite: fecha,
      etiqueta: `hasta el ${formatearFecha(fecha)} (tu próximo ingreso)`,
      preferido: null,
      preferidoFecha: null,
    }
  }

  return {
    tipo: 'dias',
    dias: HORIZONTE_POR_DEFECTO_DIAS,
    fechaLimite: sumarDias(hoy, HORIZONTE_POR_DEFECTO_DIAS),
    etiqueta: `durante los próximos ${HORIZONTE_POR_DEFECTO_DIAS} días`,
    preferido: null,
    preferidoFecha: null,
  }
}

export interface ResultadoDisponible {
  disponible: number
  totalIncluido: number
  pagosAplicados: ProximoPago[]
  presionFutura: ProximoPago[]
  atrasados: ProximoPago[]
}

export function calcularDisponible(
  cuentas: Cuenta[],
  pagos: ProximoPago[],
  horizonte: Horizonte,
  hoy = hoyLocal()
): ResultadoDisponible {
  const dineroLiquido = cuentas
    .filter((c) => c.metodo !== 'credito')
    .reduce((sum, c) => sum + aCentavos(c.saldo), 0)

  const pendientes = pagos.filter((p) => !p.pagado)

  // El límite nunca queda antes de hoy: los atrasados entran siempre.
  const limiteFinal = esAnteriorOIgual(horizonte.fechaLimite, hoy)
    ? hoy
    : horizonte.fechaLimite

  const atrasados: ProximoPago[] = []
  const pagosAplicados: ProximoPago[] = []
  const presionFutura: ProximoPago[] = []

  for (const pago of pendientes) {
    const vencido = esAtrasado(pago.fecha_vencimiento, hoy)
    if (vencido) atrasados.push(pago)
    if (vencido || esAnteriorOIgual(pago.fecha_vencimiento, limiteFinal)) {
      pagosAplicados.push(pago)
    } else {
      presionFutura.push(pago)
    }
  }

  const totalIncluido = pagosAplicados.reduce(
    (sum, pago) => sum + aCentavos(pago.monto),
    0
  )

  return {
    disponible: dineroLiquido - totalIncluido,
    totalIncluido,
    pagosAplicados,
    presionFutura,
    atrasados,
  }
}
