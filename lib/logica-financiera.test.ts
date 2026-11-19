import { describe, expect, test } from 'bun:test'
import {
  aplicarMovimiento,
  calcularSaldos,
  creditoDisponible,
  decisionPagoTarjeta,
  detectarAlertas,
  restanteTarjeta,
  tipoAjusteSaldo,
} from './logica-financiera'
import { fechaPagoTarjeta, siguienteDiaCobro } from './fechas'
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
    fecha_vencimiento: '2026-06-30',
    pagado: false,
    domiciliado: false,
    cuenta_id: null,
    cuenta_nombre: null,
    recurrente: false,
    frecuencia: 'unico',
    dia_cobro: null,
    es_tarjeta: false,
    ...overrides,
  }
}

describe('regla del crédito', () => {
  test('una compra con crédito aumenta la deuda', () => {
    const saldo = aplicarMovimiento(80000, 'egreso', 12000, 'credito')
    expect(saldo).toBe(92000)
  })

  test('un pago a la tarjeta reduce la deuda', () => {
    const saldo = aplicarMovimiento(80000, 'ingreso', 50000, 'credito')
    expect(saldo).toBe(30000)
  })

  test('en débito el ingreso suma y el egreso resta', () => {
    expect(aplicarMovimiento(10000, 'ingreso', 2500, 'debito')).toBe(12500)
    expect(aplicarMovimiento(10000, 'egreso', 2500, 'debito')).toBe(7500)
  })

  test('una compra con crédito no toca el dinero líquido', () => {
    const debito = { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 50000 }
    const credito = { cuenta_id: 2, metodo: 'credito' as const, balance_inicial: 80000 }
    const movimientos = [
      { cuenta_id: 2, tipo: 'egreso' as TipoMovimiento, monto: 12000 },
    ]

    const saldos = calcularSaldos([debito, credito], movimientos)
    const liquidos = [debito, credito]
      .filter((c) => c.metodo !== 'credito')
      .reduce((sum, c) => sum + (saldos.get(c.cuenta_id) ?? c.balance_inicial), 0)

    expect(liquidos).toBe(50000)
    expect(saldos.get(2)).toBe(92000)
  })

  test('el crédito nunca suma al dinero líquido', () => {
    const cuentas = [
      { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 50000 },
      { cuenta_id: 2, metodo: 'credito' as const, balance_inicial: 100000 },
    ]
    const movimientos = [
      { cuenta_id: 2, tipo: 'ingreso' as TipoMovimiento, monto: 40000 },
    ]

    const saldos = calcularSaldos(cuentas, movimientos)
    const liquidos = cuentas
      .filter((c) => c.metodo !== 'credito')
      .reduce((sum, c) => sum + (saldos.get(c.cuenta_id) ?? c.balance_inicial), 0)

    expect(liquidos).toBe(50000)
  })
})

describe('transferencias', () => {
  test('transferir no altera el Disponible Real', () => {
    const cuentas = [
      { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 100000 },
      { cuenta_id: 2, metodo: 'debito' as const, balance_inicial: 30000 },
    ]
    const movimientos = [
      { cuenta_id: 1, tipo: 'egreso' as TipoMovimiento, monto: 25000 },
      { cuenta_id: 2, tipo: 'ingreso' as TipoMovimiento, monto: 25000 },
    ]

    const saldos = calcularSaldos(cuentas, movimientos)
    const disponible = cuentas.reduce(
      (sum, c) => sum + (saldos.get(c.cuenta_id) ?? c.balance_inicial),
      0
    )

    expect(disponible).toBe(130000)
  })

  test('pago de tarjeta desde cuenta líquida baja deuda y baja el líquido', () => {
    const cuentas = [
      { cuenta_id: 1, metodo: 'debito' as const, balance_inicial: 100000 },
      { cuenta_id: 2, metodo: 'credito' as const, balance_inicial: 80000 },
    ]
    const movimientos = [
      { cuenta_id: 1, tipo: 'egreso' as TipoMovimiento, monto: 50000 },
      { cuenta_id: 2, tipo: 'ingreso' as TipoMovimiento, monto: 50000 },
    ]

    const saldos = calcularSaldos(cuentas, movimientos)
    expect(saldos.get(1)).toBe(50000)
    expect(saldos.get(2)).toBe(30000)
  })
})

describe('siguienteDiaCobro', () => {
  test('respeta el día de cobro dentro del mes', () => {
    expect(siguienteDiaCobro(15, '2026-03-10')).toBe('2026-03-15')
  })

  test('pasa al mes siguiente cuando el día ya ocurrió', () => {
    expect(siguienteDiaCobro(15, '2026-03-20')).toBe('2026-04-15')
  })

  test('ajusta el día 29, 30 y 31 en meses cortos', () => {
    expect(siguienteDiaCobro(31, '2026-02-10')).toBe('2026-02-28')
    expect(siguienteDiaCobro(31, '2026-04-05')).toBe('2026-04-30')
  })

  test('cruza el año correctamente', () => {
    expect(siguienteDiaCobro(5, '2026-12-28')).toBe('2027-01-05')
  })
})

describe('ciclo de la tarjeta', () => {
  test('el pago cae el mismo mes si es después del corte', () => {
    expect(fechaPagoTarjeta(20, 28, '2026-03-10')).toBe('2026-03-28')
  })

  test('la compra después del corte pasa al siguiente ciclo', () => {
    expect(fechaPagoTarjeta(20, 28, '2026-03-25')).toBe('2026-04-28')
  })

  test('pago anterior al corte cae el mes siguiente', () => {
    expect(fechaPagoTarjeta(20, 12, '2026-03-10')).toBe('2026-04-12')
  })

  test('ajusta corte y pago en meses cortos', () => {
    expect(fechaPagoTarjeta(15, 30, '2026-02-05')).toBe('2026-02-28')

    const pagoCorto = fechaPagoTarjeta(31, 15, '2026-02-05')
    expect(pagoCorto).toBe('2026-03-15')
  })

  test('no duplica el pago pendiente del mismo periodo', () => {
    expect(decisionPagoTarjeta({ proximo_pago_id: 7 })).toEqual({
      accion: 'actualizar',
      pagoId: 7,
    })
    expect(decisionPagoTarjeta(null)).toEqual({ accion: 'crear' })
  })

  test('el pago total deja en cero el siguiente periodo', () => {
    expect(restanteTarjeta(92000, 92000)).toBe(0)
    expect(restanteTarjeta(92000, 50000)).toBe(42000)
  })

  test('el crédito disponible es límite menos deuda y nunca negativo', () => {
    expect(creditoDisponible(1500000, 300000)).toBe(1200000)
    expect(creditoDisponible(1500000, 2000000)).toBe(0)
    expect(creditoDisponible(null, 300000)).toBeNull()
  })

  test('el ajuste de saldo respeta el signo de cada método', () => {
    expect(tipoAjusteSaldo(20000, 'debito')).toBe('ingreso')
    expect(tipoAjusteSaldo(-20000, 'debito')).toBe('egreso')
    expect(tipoAjusteSaldo(20000, 'credito')).toBe('egreso')
    expect(tipoAjusteSaldo(-20000, 'credito')).toBe('ingreso')
  })
})

describe('alertas de domiciliados', () => {
  test('calcula el faltante exacto acumulado', () => {
    const cuentas = [cuenta({ cuenta_id: 5, nombre: 'Débito', saldo: 10000 })]
    const pagos = [
      pago({
        proximo_pago_id: 1,
        descripcion: 'Renta',
        monto: 4000,
        fecha_vencimiento: '2026-06-10',
        domiciliado: true,
        cuenta_id: 5,
      }),
      pago({
        proximo_pago_id: 2,
        descripcion: 'Luz',
        monto: 7000,
        fecha_vencimiento: '2026-06-20',
        domiciliado: true,
        cuenta_id: 5,
      }),
    ]

    const alertas = detectarAlertas(cuentas, pagos)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].monto).toBe(7000)
    expect(alertas[0].faltante).toBe(1000)
  })

  test('no alerta cuando el saldo alcanza', () => {
    const cuentas = [cuenta({ cuenta_id: 5, saldo: 50000 })]
    const pagos = [
      pago({
        monto: 4000,
        domiciliado: true,
        cuenta_id: 5,
      }),
    ]

    expect(detectarAlertas(cuentas, pagos)).toHaveLength(0)
  })

  test('ignora pagos no domiciliados y ya pagados', () => {
    const cuentas = [cuenta({ cuenta_id: 5, saldo: 0 })]
    const pagos = [
      pago({ monto: 5000, cuenta_id: 5, domiciliado: false }),
      pago({ monto: 5000, cuenta_id: 5, domiciliado: true, pagado: true }),
    ]

    expect(detectarAlertas(cuentas, pagos)).toHaveLength(0)
  })
})
