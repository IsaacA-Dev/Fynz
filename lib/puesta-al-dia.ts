import type { Cuenta, Metodo, ProximoPago } from './acciones'
import { aCentavos, centavosACadena, parseCentavos } from './dinero'
import { esAtrasado } from './fechas'

/**
 * Lógica pura de "Poner al día".
 *
 * La persona escribe el saldo o la deuda real de hoy. Fynz compara contra lo
 * que tiene registrado y produce los ajustes mínimos. Los pagos vencidos que
 * ya se cubrieron se liquidan antes de ajustar, para no restarlos dos veces.
 */

export interface CuentaPuestaAlDia {
  cuentaId: number
  nombre: string
  metodo: Metodo
  saldoActual: number
  saldoTexto: string
}

export interface PagoPuestaAlDia {
  pagoId: number
  descripcion: string
  monto: number
  fechaVencimiento: string
  esTarjeta: boolean
  cuentaSugerida: number | null
  liquidar: boolean
  cuentaOrigen: string
}

export interface AjustePuestaAlDia {
  cuentaId: number
  saldoActual: number
  saldoObjetivo: number
  diferencia: number
}

export interface PagoSeleccionadoPuestaAlDia {
  pagoId: number
  cuentaOrigen: number
  monto: number
}

export interface ResumenPuestaAlDia {
  cuentasAjustadas: number
  pagosLiquidados: number
  totalAjustado: number
}

export type ResultadoPuestaAlDia =
  | {
      ok: true
      ajustes: AjustePuestaAlDia[]
      pagos: PagoSeleccionadoPuestaAlDia[]
      resumen: ResumenPuestaAlDia
      hayCambios: boolean
    }
  | { ok: false; error: string }

export function crearFilasCuentas(cuentas: Cuenta[]): CuentaPuestaAlDia[] {
  return cuentas.map((cuenta) => ({
    cuentaId: cuenta.cuenta_id,
    nombre: cuenta.nombre,
    metodo: cuenta.metodo,
    saldoActual: aCentavos(cuenta.saldo),
    saldoTexto: centavosACadena(cuenta.saldo),
  }))
}

export function crearFilasPagos(
  pagos: ProximoPago[],
  hoy: string,
  cuentas: Cuenta[]
): PagoPuestaAlDia[] {
  const liquidadas = cuentas.filter((cuenta) => cuenta.metodo !== 'credito')
  const unicaLiquida =
    liquidadas.length === 1 ? liquidadas[0].cuenta_id : null

  return pagos
    .filter((pago) => !pago.pagado && esAtrasado(pago.fecha_vencimiento, hoy))
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
    .map((pago) => {
      const vinculada =
        pago.cuenta_id != null
          ? liquidadas.find((cuenta) => cuenta.cuenta_id === pago.cuenta_id)
              ?.cuenta_id ?? null
          : null
      const sugerida = pago.es_tarjeta ? unicaLiquida : (vinculada ?? unicaLiquida)

      return {
        pagoId: pago.proximo_pago_id,
        descripcion: pago.descripcion,
        monto: aCentavos(pago.monto),
        fechaVencimiento: pago.fecha_vencimiento,
        esTarjeta: pago.es_tarjeta,
        cuentaSugerida: sugerida,
        liquidar: false,
        cuentaOrigen: sugerida != null ? String(sugerida) : '',
      }
    })
}

export function calcularPuestaAlDia(
  cuentas: CuentaPuestaAlDia[],
  pagos: PagoPuestaAlDia[],
  cuentasLiquidas: number[]
): ResultadoPuestaAlDia {
  const liquidas = new Set(cuentasLiquidas)
  const ajustes: AjustePuestaAlDia[] = []

  for (const cuenta of cuentas) {
    const texto = cuenta.saldoTexto.trim()

    if (texto === '') {
      return {
        ok: false,
        error: `Escribe el saldo real de ${cuenta.nombre}.`,
      }
    }

    let saldoObjetivo: number
    try {
      saldoObjetivo = parseCentavos(texto)
    } catch {
      return {
        ok: false,
        error: `El saldo de ${cuenta.nombre} no es válido.`,
      }
    }

    if (saldoObjetivo < 0) {
      return {
        ok: false,
        error: `El saldo de ${cuenta.nombre} no puede ser negativo.`,
      }
    }

    if (saldoObjetivo !== cuenta.saldoActual) {
      ajustes.push({
        cuentaId: cuenta.cuentaId,
        saldoActual: cuenta.saldoActual,
        saldoObjetivo,
        diferencia: saldoObjetivo - cuenta.saldoActual,
      })
    }
  }

  const seleccionados: PagoSeleccionadoPuestaAlDia[] = []
  const vistos = new Set<number>()

  for (const pago of pagos) {
    if (!pago.liquidar || vistos.has(pago.pagoId)) continue
    vistos.add(pago.pagoId)

    if (pago.monto <= 0) {
      return {
        ok: false,
        error: `El pago "${pago.descripcion}" no tiene un monto válido.`,
      }
    }

    const origen = Number(pago.cuentaOrigen)
    if (!Number.isInteger(origen) || origen <= 0 || !liquidas.has(origen)) {
      return {
        ok: false,
        error: `Elige una cuenta de efectivo o débito para pagar "${pago.descripcion}".`,
      }
    }

    seleccionados.push({
      pagoId: pago.pagoId,
      cuentaOrigen: origen,
      monto: pago.monto,
    })
  }

  const resumen: ResumenPuestaAlDia = {
    cuentasAjustadas: ajustes.length,
    pagosLiquidados: seleccionados.length,
    totalAjustado: ajustes.reduce(
      (total, ajuste) => total + Math.abs(ajuste.diferencia),
      0
    ),
  }

  return {
    ok: true,
    ajustes,
    pagos: seleccionados,
    resumen,
    hayCambios: ajustes.length > 0 || seleccionados.length > 0,
  }
}
