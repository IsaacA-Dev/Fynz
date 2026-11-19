import type { Cuenta, ProximoPago } from './acciones'
import type { Horizonte } from './horizonte'
import { aCentavos } from './dinero'
import { aDiaNumero, esAnteriorOIgual, hoyLocal } from './fechas'
import { detectarAlertas } from './logica-financiera'
import { calcularDisponible } from './horizonte'
import { ciclosDeTarjeta } from './ciclos-tarjeta'

export interface AlertaImpacto {
  descripcion: string
  cuentaNombre: string
  faltante: number
}

export type ImpactoCompra =
  | {
      tipo: 'liquido'
      disponibleAntes: number
      disponibleDespues: number
      alertas: AlertaImpacto[]
    }
  | {
      tipo: 'credito'
      deudaAntes: number
      deudaDespues: number
      vencimientoCiclo: string | null
      montoCompromiso: number | null
      disponibleAntes: number
      disponibleDespues: number | null
      dentroDelHorizonte: boolean
      liquididadSinCambio: true
    }

export function impactoCompra(opciones: {
  monto: number
  cuentaId: number
  cuentas: Cuenta[]
  pagos: ProximoPago[]
  horizonte: Horizonte
  disponibleReal: number
  hoy?: string
}): ImpactoCompra | null {
  const monto = aCentavos(opciones.monto)
  if (monto <= 0) return null

  const cuenta = opciones.cuentas.find((c) => c.cuenta_id === opciones.cuentaId)
  if (!cuenta) return null

  if (cuenta.metodo !== 'credito') {
    const disponibleDespues = opciones.disponibleReal - monto

    const cuentasSimuladas = opciones.cuentas.map((c) =>
      c.cuenta_id === cuenta.cuenta_id
        ? { ...c, saldo: aCentavos(c.saldo) - monto }
        : c
    )

    const alertas = detectarAlertas(cuentasSimuladas, opciones.pagos).map((a) => ({
      descripcion: a.descripcion,
      cuentaNombre: a.cuentaNombre,
      faltante: a.faltante,
    }))

    return {
      tipo: 'liquido',
      disponibleAntes: opciones.disponibleReal,
      disponibleDespues,
      alertas,
    }
  }

  const hoy = opciones.hoy ?? hoyLocal()
  let vencimientoCiclo: string | null = null
  let montoCompromiso: number | null = null

  if (cuenta.dia_corte != null && cuenta.dia_pago != null) {
    const ciclos = ciclosDeTarjeta(
      {
        diaCorte: cuenta.dia_corte,
        diaPago: cuenta.dia_pago,
        balanceInicial: cuenta.balance_inicial,
        fechaInicio: hoy,
        nombre: cuenta.nombre,
      },
      [{ tipo: 'egreso', monto, fecha: hoy }],
      hoy
    )

    const cicloConCompra = ciclos.find(
      (c) => aDiaNumero(c.fechaCorte) > aDiaNumero(hoy) && c.compras >= monto
    )
    vencimientoCiclo = cicloConCompra?.fechaPago ?? null
  }

  let disponibleDespues: number | null = null
  let dentroDelHorizonte = false

  if (vencimientoCiclo != null) {
    // El compromiso del ciclo, si ya existe, se reemplaza (no se duplica) al comprar.
    const existente = opciones.pagos.find(
      (p) =>
        p.es_tarjeta &&
        p.cuenta_id === cuenta.cuenta_id &&
        p.fecha_vencimiento === vencimientoCiclo
    )
    montoCompromiso = (existente ? aCentavos(existente.monto) : 0) + monto

    const pagoSimulado: ProximoPago = {
      proximo_pago_id: -1,
      descripcion: 'Pago estimado de tarjeta',
      monto: montoCompromiso,
      fecha_vencimiento: vencimientoCiclo,
      pagado: false,
      domiciliado: false,
      cuenta_id: cuenta.cuenta_id,
      cuenta_nombre: null,
      recurrente: true,
      dia_cobro: Number(vencimientoCiclo.slice(8, 10)),
      frecuencia: 'mensual',
      es_tarjeta: true,
    }

    const pagosSinCiclo = opciones.pagos.filter(
      (p) =>
        !(
          p.es_tarjeta &&
          p.cuenta_id === cuenta.cuenta_id &&
          p.fecha_vencimiento === vencimientoCiclo
        )
    )

    const simulado = calcularDisponible(
      opciones.cuentas,
      [...pagosSinCiclo, pagoSimulado],
      opciones.horizonte,
      hoy
    )

    dentroDelHorizonte = esAnteriorOIgual(
      vencimientoCiclo,
      opciones.horizonte.fechaLimite
    )
    disponibleDespues = dentroDelHorizonte ? simulado.disponible : null
  }

  return {
    tipo: 'credito',
    deudaAntes: aCentavos(cuenta.saldo),
    deudaDespues: aCentavos(cuenta.saldo) + monto,
    vencimientoCiclo,
    montoCompromiso,
    disponibleAntes: opciones.disponibleReal,
    disponibleDespues,
    dentroDelHorizonte,
    liquididadSinCambio: true,
  }
}
