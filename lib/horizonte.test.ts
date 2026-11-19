import { describe, expect, test } from 'bun:test'
import { calcularDisponible, calcularHorizonte } from './horizonte'
import type { Cuenta, ProximoPago } from './acciones'

const HOY = '2026-03-10'

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
    fecha_vencimiento: HOY,
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

describe('calcularHorizonte', () => {
  test('prioridad: fecha explícita gana sobre días', () => {
    const horizonte = calcularHorizonte(
      { proximoIngreso: '2026-03-25', preferido: 15, preferidoFecha: '2026-03-30' },
      HOY
    )
    expect(horizonte.tipo).toBe('fecha')
    expect(horizonte.fechaLimite).toBe('2026-03-30')
    expect(horizonte.preferido).toBe(15)
    expect(horizonte.preferidoFecha).toBe('2026-03-30')
  })

  test('días 7/15/30 se usan cuando están definidos', () => {
    const horizonte = calcularHorizonte({ proximoIngreso: null, preferido: 7, preferidoFecha: null }, HOY)
    expect(horizonte).toMatchObject({
      tipo: 'dias',
      dias: 7,
      fechaLimite: '2026-03-17',
      etiqueta: 'durante los próximos 7 días',
    })
  })

  test('auto con próximo ingreso usa su fecha como límite', () => {
    const horizonte = calcularHorizonte(
      { proximoIngreso: '2026-03-25', preferido: null, preferidoFecha: null },
      HOY
    )
    expect(horizonte).toMatchObject({
      tipo: 'ingreso',
      dias: null,
      fechaLimite: '2026-03-25',
    })
    expect(horizonte.etiqueta).toContain('próximo ingreso')
  })

  test('sin preferencias ni ingreso: fallback de 30 días', () => {
    const horizonte = calcularHorizonte({ proximoIngreso: null, preferido: null, preferidoFecha: null }, HOY)
    expect(horizonte).toMatchObject({
      tipo: 'dias',
      dias: 30,
      fechaLimite: '2026-04-09',
    })
    expect(horizonte.etiqueta).toContain('30 días')
  })

  test('preferido inválido (0/negativo) se descarta y cae al ingreso', () => {
    const horizonte = calcularHorizonte(
      { proximoIngreso: '2026-03-20', preferido: 0, preferidoFecha: null },
      HOY
    )
    expect(horizonte.tipo).toBe('ingreso')
    expect(horizonte.preferido).toBeNull()
  })
})

describe('calcularDisponible', () => {
  test('líquido menos compromisos dentro del horizonte', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 100000 })]
    const horizonte = calcularHorizonte({ proximoIngreso: null, preferido: 30, preferidoFecha: null }, HOY)
    const pagos = [
      pago({ proximo_pago_id: 1, monto: 40000, fecha_vencimiento: '2026-03-15' }),
      pago({ proximo_pago_id: 2, monto: 90000, fecha_vencimiento: '2026-05-01' }),
    ]

    const resultado = calcularDisponible(cuentas, pagos, horizonte, HOY)

    expect(resultado.disponible).toBe(60000)
    expect(resultado.totalIncluido).toBe(40000)
    expect(resultado.pagosAplicados.map((p) => p.proximo_pago_id)).toEqual([1])
    expect(resultado.presionFutura.map((p) => p.proximo_pago_id)).toEqual([2])
  })

  test('los atrasados entran siempre, aunque queden fuera por días', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 100000 })]
    const horizonte = calcularHorizonte({ proximoIngreso: null, preferido: 7, preferidoFecha: null }, HOY)
    const pagos = [
      pago({ proximo_pago_id: 1, monto: 30000, fecha_vencimiento: '2026-02-28' }),
      pago({ proximo_pago_id: 2, monto: 20000, fecha_vencimiento: '2026-03-14' }),
    ]

    const resultado = calcularDisponible(cuentas, pagos, horizonte, HOY)

    expect(resultado.pagosAplicados.map((p) => p.proximo_pago_id)).toEqual([1, 2])
    expect(resultado.atrasados.map((p) => p.proximo_pago_id)).toEqual([1])
    expect(resultado.presionFutura).toHaveLength(0)
  })

  test('el pago que cae justo en la fecha límite entra', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 50000 })]
    const horizonte = calcularHorizonte({ proximoIngreso: null, preferido: 7, preferidoFecha: null }, HOY)
    const pagos = [pago({ monto: 25000, fecha_vencimiento: '2026-03-17' })]

    const resultado = calcularDisponible(cuentas, pagos, horizonte, HOY)

    expect(resultado.totalIncluido).toBe(25000)
    expect(resultado.presionFutura).toHaveLength(0)
  })

  test('si la fecha de horizonte ya pasó, se usa hoy (atrasados al menos)', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 100000 })]
    const horizonte = calcularHorizonte(
      { proximoIngreso: null, preferido: null, preferidoFecha: '2026-03-01' },
      HOY
    )
    const pagos = [
      pago({ proximo_pago_id: 1, monto: 30000, fecha_vencimiento: '2026-02-28' }),
      pago({ proximo_pago_id: 2, monto: 20000, fecha_vencimiento: '2026-03-08' }),
    ]

    const resultado = calcularDisponible(cuentas, pagos, horizonte, HOY)

    expect(resultado.pagosAplicados.map((p) => p.proximo_pago_id)).toEqual([1, 2])
    expect(resultado.disponible).toBe(50000)
  })

  test('el ingreso estimado nunca suma liquidez', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 100000 })]
    const horizonte = calcularHorizonte(
      { proximoIngreso: '2026-03-20', preferido: null, preferidoFecha: null },
      HOY
    )
    const pagos = [pago({ monto: 30000, fecha_vencimiento: '2026-03-15' })]

    const resultado = calcularDisponible(cuentas, pagos, horizonte, HOY)

    expect(resultado.disponible).toBe(70000)
  })

  test('ignora pagos ya liquidados', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 50000 })]
    const horizonte = calcularHorizonte({ proximoIngreso: null, preferido: 30, preferidoFecha: null }, HOY)
    const pagos = [pago({ monto: 25000, pagado: true })]

    const resultado = calcularDisponible(cuentas, pagos, horizonte, HOY)

    expect(resultado.totalIncluido).toBe(0)
    expect(resultado.disponible).toBe(50000)
  })
})
