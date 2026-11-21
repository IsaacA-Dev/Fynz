import type { Cuenta, Metodo, ProximoPago, TipoMovimiento } from './acciones'
import { aCentavos } from './dinero'
import {
  esAnteriorOIgual,
  esAtrasado,
  hoyLocal,
  ordenarPorFecha,
} from './fechas'

export interface MovimientoSaldo {
  cuenta_id: number
  tipo: TipoMovimiento
  monto: number
}

export interface AlertaDomiciliado {
  pagoId: number
  descripcion: string
  monto: number
  fechaVencimiento: string
  cuentaNombre: string
  faltante: number
}

export function aplicarMovimiento(
  saldo: number,
  tipo: TipoMovimiento,
  monto: number,
  metodo: Metodo
): number {
  const m = aCentavos(monto)
  if (metodo === 'credito') {
    // En crédito el saldo representa la deuda: una compra la aumenta y un pago la reduce.
    return saldo + (tipo === 'egreso' ? m : -m)
  }
  return saldo + (tipo === 'ingreso' ? m : -m)
}

export function calcularSaldos(
  cuentas: Array<{ cuenta_id: number; metodo: Metodo; balance_inicial: number }>,
  movimientos: MovimientoSaldo[]
): Map<number, number> {
  const saldos = new Map<number, number>()
  for (const t of movimientos) {
    const cuenta = cuentas.find((c) => c.cuenta_id === t.cuenta_id)
    if (!cuenta) continue
    const previo = saldos.get(t.cuenta_id) ?? aCentavos(cuenta.balance_inicial)
    saldos.set(t.cuenta_id, aplicarMovimiento(previo, t.tipo, t.monto, cuenta.metodo))
  }
  return saldos
}

export type DecisionPagoTarjeta =
  | { accion: 'crear' }
  | { accion: 'actualizar'; pagoId: number }

export function decisionPagoTarjeta(
  pendiente: { proximo_pago_id: number } | null
): DecisionPagoTarjeta {
  return pendiente
    ? { accion: 'actualizar', pagoId: pendiente.proximo_pago_id }
    : { accion: 'crear' }
}

export function restanteTarjeta(
  montoCompromiso: number,
  montoPagado: number
): number {
  return Math.max(0, aCentavos(montoCompromiso) - aCentavos(montoPagado))
}

export function creditoDisponible(
  limite: number | null,
  deuda: number
): number | null {
  if (limite == null) return null
  return Math.max(0, aCentavos(limite) - aCentavos(deuda))
}

export function tipoAjusteSaldo(delta: number, metodo: Metodo): TipoMovimiento {
  if (metodo === 'credito') return delta > 0 ? 'egreso' : 'ingreso'
  return delta > 0 ? 'ingreso' : 'egreso'
}

export function detectarAlertas(
  cuentas: Cuenta[],
  pagos: ProximoPago[],
  limite: string | null = null,
  hoy = hoyLocal()
): AlertaDomiciliado[] {
  const pendientes = pagos.filter(
    (p) =>
      p.domiciliado &&
      !p.pagado &&
      p.cuenta_id != null &&
      (limite == null ||
        esAtrasado(p.fecha_vencimiento, hoy) ||
        esAnteriorOIgual(p.fecha_vencimiento, limite))
  )

  const porCuenta = new Map<number, ProximoPago[]>()
  for (const p of pendientes) {
    const lista = porCuenta.get(p.cuenta_id!) ?? []
    lista.push(p)
    porCuenta.set(p.cuenta_id!, lista)
  }

  const alertas: AlertaDomiciliado[] = []
  for (const [cuentaId, lista] of porCuenta) {
    const cuenta = cuentas.find((c) => c.cuenta_id === cuentaId)
    if (!cuenta) continue

    const ordenada = ordenarPorFecha(lista, (p) => p.fecha_vencimiento)

    let acumulado = 0
    for (const p of ordenada) {
      acumulado += aCentavos(p.monto)
      if (acumulado > aCentavos(cuenta.saldo)) {
        alertas.push({
          pagoId: p.proximo_pago_id,
          descripcion: p.descripcion,
          monto: aCentavos(p.monto),
          fechaVencimiento: p.fecha_vencimiento,
          cuentaNombre: cuenta.nombre,
          faltante: acumulado - aCentavos(cuenta.saldo),
        })
      }
    }
  }

  return ordenarPorFecha(alertas, (a) => a.fechaVencimiento)
}
