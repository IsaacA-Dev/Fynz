import { describe, expect, test } from 'bun:test'
import {
  aplicarMovimiento,
  calcularSaldos,
  creditoDisponible,
  decisionPagoTarjeta,
  detectarAlertas,
  fechaPagoTarjeta,
  restanteTarjeta,
  siguienteDiaCobro,
  tipoAjusteSaldo,
} from './logica-financiera'
import type { Cuenta, ProximoPago, TipoMovimiento } from './acciones'

function cuenta(overrides: Partial<Cuenta> = {}): Cuenta {
  return {
    cuenta_id: 1,
    nombre: 'Cuenta',
    metodo: 'debito',
    balance_inicial: 0,
    saldo: 0,
    dia_corte: null,
    dia_pago: null,
    limite: null,
    ...overrides,
  }
}

function pago(overrides: Partial<ProximoPago> = {}): ProximoPago {
  return {
    proximo_pago_id: 1,
    descripcion: 'Pago',
    monto: 0,
    fecha_vencimiento: '2026-06-30T00:00:00.000Z',
    pagado: false,
    domiciliado: false,
    cuenta_id: null,
    cuenta_nombre: null,
    recurrente: false,
    dia_cobro: null,
    es_tarjeta: false,
    ...overrides,
  }
}

describe('regla del crédito', () => {
  test('una compra con crédito aumenta la deuda', () => {
    const saldo = aplicarMovimiento(800, 'egreso', 120, 'credito')
    expect(saldo).toBe(920)
  })

  test('un pago a la tarjeta reduce la deuda', () => {
    const saldo = aplicarMovimiento(800, 'ingreso', 500, 'credito')
    expect(saldo).toBe(300)
  })

  test('en débito el ingreso suma y el egreso resta', () => {
    expect(aplicarMovimiento(100, 'ingreso', 25, 'debito')).toBe(125)
    expect(aplicarMovimiento(100, 'egreso', 25, 'debito')).toBe(75)
  })

  test('una compra con crédito no toca el dinero líquido', () => {
    const debito = { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 500 }
    const credito = { cuenta_id: 2, metodo: 'credito' as const, balance_inicial: 800 }
    const movimientos = [
      { cuenta_id: 2, tipo: 'egreso' as TipoMovimiento, monto: 120 },
    ]

    const saldos = calcularSaldos([debito, credito], movimientos)
    const liquidos = [debito, credito]
      .filter((c) => c.metodo !== 'credito')
      .reduce((sum, c) => sum + (saldos.get(c.cuenta_id) ?? c.balance_inicial), 0)

    expect(liquidos).toBe(500)
    expect(saldos.get(2)).toBe(920)
  })

  test('el crédito nunca suma al dinero líquido', () => {
    const cuentas = [
      { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 500 },
      { cuenta_id: 2, metodo: 'credito' as const, balance_inicial: 1000 },
    ]
    const movimientos = [
      { cuenta_id: 2, tipo: 'ingreso' as TipoMovimiento, monto: 400 },
    ]

    const saldos = calcularSaldos(cuentas, movimientos)
    const liquidos = cuentas
      .filter((c) => c.metodo !== 'credito')
      .reduce((sum, c) => sum + (saldos.get(c.cuenta_id) ?? c.balance_inicial), 0)

    expect(liquidos).toBe(500)
  })
})

describe('transferencias', () => {
  test('transferir no altera el Disponible Real', () => {
    const cuentas = [
      { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 1000 },
      { cuenta_id: 2, metodo: 'debito' as const, balance_inicial: 300 },
    ]
    const movimientos = [
      { cuenta_id: 1, tipo: 'egreso' as TipoMovimiento, monto: 250 },
      { cuenta_id: 2, tipo: 'ingreso' as TipoMovimiento, monto: 250 },
    ]

    const saldos = calcularSaldos(cuentas, movimientos)
    const disponible = cuentas.reduce(
      (sum, c) => sum + (saldos.get(c.cuenta_id) ?? c.balance_inicial),
      0
    )

    expect(disponible).toBe(1300)
  })

  test('pago de tarjeta desde cuenta líquida baja deuda y baja el líquido', () => {
    const cuentas = [
      { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 1000 },
      { cuenta_id: 2, metodo: 'credito' as const, balance_inicial: 800 },
    ]
    const movimientos = [
      { cuenta_id: 1, tipo: 'egreso' as TipoMovimiento, monto: 500 },
      { cuenta_id: 2, tipo: 'ingreso' as TipoMovimiento, monto: 500 },
    ]

    const saldos = calcularSaldos(cuentas, movimientos)
    expect(saldos.get(1)).toBe(500)
    expect(saldos.get(2)).toBe(300)
  })
})

describe('siguienteDiaCobro', () => {
  test('respeta el día de cobro dentro del mes', () => {
    const fecha = siguienteDiaCobro(15, new Date(2026, 2, 10))
    const resultado = new Date(fecha)
    expect(resultado.getFullYear()).toBe(2026)
    expect(resultado.getMonth()).toBe(2)
    expect(resultado.getDate()).toBe(15)
  })

  test('pasa al mes siguiente cuando el día ya ocurrió', () => {
    const fecha = siguienteDiaCobro(15, new Date(2026, 2, 20))
    const resultado = new Date(fecha)
    expect(resultado.getFullYear()).toBe(2026)
    expect(resultado.getMonth()).toBe(3)
    expect(resultado.getDate()).toBe(15)
  })

  test('ajusta el día 29, 30 y 31 en meses cortos', () => {
    const febrero = siguienteDiaCobro(31, new Date(2026, 1, 10))
    expect(new Date(febrero).getDate()).toBe(28)

    const abril = siguienteDiaCobro(31, new Date(2026, 3, 5))
    expect(new Date(abril).getDate()).toBe(30)
  })
})

describe('ciclo de la tarjeta', () => {
  test('el pago cae el mismo mes si es después del corte', () => {
    const fecha = fechaPagoTarjeta(20, 28, new Date(2026, 2, 10))
    const resultado = new Date(fecha)
    expect(resultado.getFullYear()).toBe(2026)
    expect(resultado.getMonth()).toBe(2)
    expect(resultado.getDate()).toBe(28)
  })

  test('la compra después del corte pasa al siguiente ciclo', () => {
    const fecha = fechaPagoTarjeta(20, 28, new Date(2026, 2, 25))
    const resultado = new Date(fecha)
    expect(resultado.getFullYear()).toBe(2026)
    expect(resultado.getMonth()).toBe(3)
    expect(resultado.getDate()).toBe(28)
  })

  test('pago anterior al corte cae el mes siguiente', () => {
    const fecha = fechaPagoTarjeta(20, 12, new Date(2026, 2, 10))
    const resultado = new Date(fecha)
    expect(resultado.getFullYear()).toBe(2026)
    expect(resultado.getMonth()).toBe(3)
    expect(resultado.getDate()).toBe(12)
  })

  test('ajusta corte y pago en meses cortos', () => {
    const corteYpago = fechaPagoTarjeta(15, 30, new Date(2026, 1, 5))
    expect(new Date(corteYpago).getDate()).toBe(28)

    const pagoCorto = fechaPagoTarjeta(31, 15, new Date(2026, 1, 5))
    expect(new Date(pagoCorto).getDate()).toBe(15)
    expect(new Date(pagoCorto).getMonth()).toBe(2)
  })

  test('no duplica el pago pendiente del mismo periodo', () => {
    expect(decisionPagoTarjeta({ proximo_pago_id: 7 })).toEqual({
      accion: 'actualizar',
      pagoId: 7,
    })
    expect(decisionPagoTarjeta(null)).toEqual({ accion: 'crear' })
  })

  test('el pago total deja en cero el siguiente periodo', () => {
    expect(restanteTarjeta(920, 920)).toBe(0)
    expect(restanteTarjeta(920, 500)).toBe(420)
  })

  test('el crédito disponible es límite menos deuda y nunca negativo', () => {
    expect(creditoDisponible(15000, 3000)).toBe(12000)
    expect(creditoDisponible(15000, 20000)).toBe(0)
    expect(creditoDisponible(null, 3000)).toBeNull()
  })

  test('el ajuste de saldo respeta el signo de cada método', () => {
    expect(tipoAjusteSaldo(200, 'debito')).toBe('ingreso')
    expect(tipoAjusteSaldo(-200, 'debito')).toBe('egreso')
    expect(tipoAjusteSaldo(200, 'credito')).toBe('egreso')
    expect(tipoAjusteSaldo(-200, 'credito')).toBe('ingreso')
  })
})

describe('alertas de domiciliados', () => {
  test('calcula el faltante exacto acumulado', () => {
    const cuentas = [cuenta({ cuenta_id: 5, nombre: 'Débito', saldo: 100 })]
    const pagos = [
      pago({
        proximo_pago_id: 1,
        descripcion: 'Renta',
        monto: 40,
        fecha_vencimiento: '2026-06-10T00:00:00.000Z',
        domiciliado: true,
        cuenta_id: 5,
      }),
      pago({
        proximo_pago_id: 2,
        descripcion: 'Luz',
        monto: 70,
        fecha_vencimiento: '2026-06-20T00:00:00.000Z',
        domiciliado: true,
        cuenta_id: 5,
      }),
    ]

    const alertas = detectarAlertas(cuentas, pagos)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].monto).toBe(70)
    expect(alertas[0].faltante).toBe(10)
  })

  test('no alerta cuando el saldo alcanza', () => {
    const cuentas = [cuenta({ cuenta_id: 5, saldo: 500 })]
    const pagos = [
      pago({
        monto: 40,
        domiciliado: true,
        cuenta_id: 5,
      }),
    ]

    expect(detectarAlertas(cuentas, pagos)).toHaveLength(0)
  })

  test('ignora pagos no domiciliados y ya pagados', () => {
    const cuentas = [cuenta({ cuenta_id: 5, saldo: 0 })]
    const pagos = [
      pago({ monto: 50, cuenta_id: 5, domiciliado: false }),
      pago({ monto: 50, cuenta_id: 5, domiciliado: true, pagado: true }),
    ]

    expect(detectarAlertas(cuentas, pagos)).toHaveLength(0)
  })
})
