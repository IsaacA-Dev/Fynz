import type { Cuenta, Metodo, ProximoPago, TipoMovimiento } from './acciones'
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

const REDONDEO = 100

function aNumero(valor: unknown): number {
  return Number(valor ?? 0)
}

export function redondearDinero(valor: number): number {
  return Math.round(valor * REDONDEO) / REDONDEO
}

export function aplicarMovimiento(
  saldo: number,
  tipo: TipoMovimiento,
  monto: number,
  metodo: Metodo
): number {
  const m = aNumero(monto)
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
    const previo = saldos.get(t.cuenta_id) ?? aNumero(cuenta.balance_inicial)
    saldos.set(t.cuenta_id, aplicarMovimiento(previo, t.tipo, t.monto, cuenta.metodo))
  }
  return saldos
}

function diaValido(dia: number): boolean {
  return Number.isInteger(dia) && dia >= 1 && dia <= 31
}

function conClamp(anio: number, mes: number, dia: number): Date {
  const maxDia = new Date(anio, mes + 1, 0).getDate()
  return new Date(anio, mes, Math.min(dia, maxDia))
}

export function siguienteDiaCobro(dia: number, desde: Date): string {
  if (!diaValido(dia)) return desde.toISOString()

  const inicio = new Date(
    desde.getFullYear(),
    desde.getMonth(),
    desde.getDate()
  )

  const mesActual = conClamp(inicio.getFullYear(), inicio.getMonth(), dia)
  if (mesActual.getTime() >= inicio.getTime()) return mesActual.toISOString()

  const mesSiguiente = conClamp(inicio.getFullYear(), inicio.getMonth() + 1, dia)
  return mesSiguiente.toISOString()
}

export function fechaPagoTarjeta(
  diaCorte: number,
  diaPago: number,
  hoy: Date
): string {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  let corte = conClamp(inicio.getFullYear(), inicio.getMonth(), diaCorte)
  if (corte.getTime() < inicio.getTime()) {
    corte = conClamp(inicio.getFullYear(), inicio.getMonth() + 1, diaCorte)
  }

  const mesPago = diaPago > diaCorte ? 0 : 1
  const pago = conClamp(corte.getFullYear(), corte.getMonth() + mesPago, diaPago)
  return pago.toISOString()
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
  return Math.max(0, redondearDinero(montoCompromiso - montoPagado))
}

export function creditoDisponible(
  limite: number | null,
  deuda: number
): number | null {
  if (limite == null) return null
  return Math.max(0, redondearDinero(limite - deuda))
}

export function tipoAjusteSaldo(
  delta: number,
  metodo: Metodo
): TipoMovimiento {
  if (metodo === 'credito') return delta > 0 ? 'egreso' : 'ingreso'
  return delta > 0 ? 'ingreso' : 'egreso'
}

export function detectarAlertas(
  cuentas: Cuenta[],
  pagos: ProximoPago[]
): AlertaDomiciliado[] {
  const pendientes = pagos.filter(
    (p) => p.domiciliado && !p.pagado && p.cuenta_id != null
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

    lista.sort(
      (a, b) =>
        new Date(a.fecha_vencimiento).getTime() -
        new Date(b.fecha_vencimiento).getTime()
    )

    let acumulado = 0
    for (const p of lista) {
      acumulado += p.monto
      if (acumulado > cuenta.saldo) {
        alertas.push({
          pagoId: p.proximo_pago_id,
          descripcion: p.descripcion,
          monto: p.monto,
          fechaVencimiento: p.fecha_vencimiento,
          cuentaNombre: cuenta.nombre,
          faltante: redondearDinero(acumulado - cuenta.saldo),
        })
      }
    }
  }

  alertas.sort(
    (a, b) =>
      new Date(a.fechaVencimiento).getTime() -
      new Date(b.fechaVencimiento).getTime()
  )

  return alertas
}
