import type { Cuenta, ProximoPago } from './acciones'
import { esAnteriorOIgual, sumarDias } from './fechas'

export const DIAS_VENTANA_CHECKLIST = 2

/**
 * Un pago semanal entra al checklist cuando está pendiente, no es de tarjeta
 * y vence dentro de los próximos dos días. Los vencidos siempre entran.
 */
export function esPagoEnChecklistSemanal(
  pago: ProximoPago,
  hoy: string
): boolean {
  if (pago.pagado || pago.es_tarjeta) return false
  if (pago.frecuencia !== 'semanal') return false
  return esAnteriorOIgual(
    pago.fecha_vencimiento,
    sumarDias(hoy, DIAS_VENTANA_CHECKLIST)
  )
}

export function pagosSemanalesEnVentana(
  pagos: ProximoPago[],
  hoy: string
): ProximoPago[] {
  return pagos
    .filter((pago) => esPagoEnChecklistSemanal(pago, hoy))
    .sort((a, b) => {
      const porFecha = a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
      return porFecha !== 0
        ? porFecha
        : a.descripcion.localeCompare(b.descripcion)
    })
}

/** Vista de Próximos pagos sin los semanales que ya están en el checklist. */
export function pagosParaProximos(
  pagos: ProximoPago[],
  hoy: string
): ProximoPago[] {
  return pagos.filter((pago) => !esPagoEnChecklistSemanal(pago, hoy))
}

export function cuentasLiquidas(cuentas: Cuenta[]): Cuenta[] {
  return cuentas.filter((cuenta) => cuenta.metodo !== 'credito')
}

/**
 * Cuenta que se usará por defecto al marcar el pago:
 * 1. La cuenta domiciliada si sigue activa y es líquida.
 * 2. La primera cuenta líquida activa.
 */
export function cuentaSugeridaChecklist(
  pago: ProximoPago,
  cuentas: Cuenta[]
): number | null {
  const liquidas = cuentasLiquidas(cuentas)

  if (pago.domiciliado && pago.cuenta_id != null) {
    const domiciliada = liquidas.find(
      (cuenta) => cuenta.cuenta_id === pago.cuenta_id
    )
    if (domiciliada) return domiciliada.cuenta_id
  }

  return liquidas[0]?.cuenta_id ?? null
}

/**
 * El selector compacto solo hace falta cuando no hay una cuenta domiciliada
 * válida y existen varias cuentas líquidas.
 */
export function requiereSelectorCuenta(
  pago: ProximoPago,
  cuentas: Cuenta[]
): boolean {
  const liquidas = cuentasLiquidas(cuentas)

  if (pago.domiciliado && pago.cuenta_id != null) {
    const domiciliada = liquidas.some(
      (cuenta) => cuenta.cuenta_id === pago.cuenta_id
    )
    if (domiciliada) return false
  }

  return liquidas.length > 1
}
