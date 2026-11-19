import { describe, expect, test } from 'bun:test'
import type { Cuenta, ProximoPago } from './acciones'
import {
  calcularPuestaAlDia,
  crearFilasCuentas,
  crearFilasPagos,
} from './puesta-al-dia'

const HOY = '2026-11-19'

function cuenta(overrides: Partial<Cuenta> = {}): Cuenta {
  return {
    cuenta_id: 1,
    nombre: 'Nómina',
    metodo: 'debito',
    balance_inicial: 0,
    saldo: 100000,
    dia_corte: null,
    dia_pago: null,
    limite: null,
    ...overrides,
  }
}

function pago(overrides: Partial<ProximoPago> = {}): ProximoPago {
  return {
    proximo_pago_id: 1,
    descripcion: 'Renta',
    monto: 200000,
    fecha_vencimiento: '2026-11-15',
    pagado: false,
    domiciliado: true,
    cuenta_id: 1,
    cuenta_nombre: 'Nómina',
    recurrente: false,
    frecuencia: 'unico',
    dia_cobro: null,
    es_tarjeta: false,
    ...overrides,
  }
}

describe('crearFilasCuentas', () => {
  test('convierte los saldos a centavos y texto editable', () => {
    const filas = crearFilasCuentas([
      cuenta({ cuenta_id: 1, saldo: 123456 }),
      cuenta({ cuenta_id: 2, nombre: 'Tarjeta', metodo: 'credito', saldo: 450000 }),
    ])

    expect(filas).toEqual([
      {
        cuentaId: 1,
        nombre: 'Nómina',
        metodo: 'debito',
        saldoActual: 123456,
        saldoTexto: '1234.56',
      },
      {
        cuentaId: 2,
        nombre: 'Tarjeta',
        metodo: 'credito',
        saldoActual: 450000,
        saldoTexto: '4500.00',
      },
    ])
  })
})

describe('crearFilasPagos', () => {
  test('solo incluye pagos vencidos y pendientes, ordenados por fecha', () => {
    const cuentas = [
      cuenta({ cuenta_id: 1 }),
      cuenta({ cuenta_id: 2, nombre: 'Efectivo', metodo: 'efectivo' }),
      cuenta({ cuenta_id: 3, nombre: 'Tarjeta', metodo: 'credito', saldo: 300000 }),
    ]
    const filas = crearFilasPagos(
      [
        pago({ proximo_pago_id: 2, descripcion: 'Internet', fecha_vencimiento: '2026-11-10' }),
        pago({ proximo_pago_id: 1, descripcion: 'Renta', fecha_vencimiento: '2026-11-15' }),
        pago({ proximo_pago_id: 3, descripcion: 'Futuro', fecha_vencimiento: '2026-11-25' }),
        pago({ proximo_pago_id: 4, descripcion: 'Pagado', pagado: true }),
        pago({
          proximo_pago_id: 5,
          descripcion: 'Tarjeta',
          fecha_vencimiento: '2026-11-18',
          es_tarjeta: true,
          cuenta_id: 3,
          domiciliado: false,
        }),
      ],
      HOY,
      cuentas
    )

    expect(filas.map((fila) => fila.descripcion)).toEqual([
      'Internet',
      'Renta',
      'Tarjeta',
    ])
    expect(filas[0]).toMatchObject({
      pagoId: 2,
      cuentaSugerida: 1,
      cuentaOrigen: '1',
      liquidar: false,
    })
    expect(filas[2]).toMatchObject({
      esTarjeta: true,
      cuentaSugerida: null,
      cuentaOrigen: '',
    })
  })

  test('sugiere la única cuenta líquida cuando el pago no tiene cuenta', () => {
    const filas = crearFilasPagos(
      [
        pago({
          cuenta_id: null,
          domiciliado: false,
          es_tarjeta: false,
          fecha_vencimiento: '2026-11-01',
        }),
      ],
      HOY,
      [cuenta({ cuenta_id: 9, nombre: 'Única', metodo: 'efectivo' })]
    )

    expect(filas[0].cuentaSugerida).toBe(9)
    expect(filas[0].cuentaOrigen).toBe('9')
  })
})

describe('calcularPuestaAlDia', () => {
  const cuentas = crearFilasCuentas([
    cuenta({ cuenta_id: 1, nombre: 'Nómina', saldo: 10000 }),
    cuenta({ cuenta_id: 2, nombre: 'Tarjeta', metodo: 'credito', saldo: 30000 }),
    cuenta({ cuenta_id: 3, nombre: 'Efectivo', metodo: 'efectivo', saldo: 5000 }),
  ])

  test('genera solo los ajustes con diferencia y calcula el resumen', () => {
    const resultado = calcularPuestaAlDia(
      [
        { ...cuentas[0], saldoTexto: '120.00' },
        { ...cuentas[1], saldoTexto: '250.00' },
        { ...cuentas[2], saldoTexto: '50.00' },
      ],
      [],
      [1, 3]
    )

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return

    expect(resultado.ajustes).toEqual([
      {
        cuentaId: 1,
        saldoActual: 10000,
        saldoObjetivo: 12000,
        diferencia: 2000,
      },
      {
        cuentaId: 2,
        saldoActual: 30000,
        saldoObjetivo: 25000,
        diferencia: -5000,
      },
    ])
    expect(resultado.resumen).toEqual({
      cuentasAjustadas: 2,
      pagosLiquidados: 0,
      totalAjustado: 7000,
    })
    expect(resultado.hayCambios).toBe(true)
  })

  test('incluye pagos seleccionados con una cuenta líquida válida', () => {
    const pagos = crearFilasPagos([pago({ proximo_pago_id: 7, monto: 20000 })], HOY, [
      cuenta({ cuenta_id: 1 }),
    ])

    const resultado = calcularPuestaAlDia(
      cuentas,
      [{ ...pagos[0], liquidar: true, cuentaOrigen: '1' }],
      [1, 3]
    )

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.pagos).toEqual([
      { pagoId: 7, cuentaOrigen: 1, monto: 20000 },
    ])
    expect(resultado.resumen.pagosLiquidados).toBe(1)
    expect(resultado.hayCambios).toBe(true)
  })

  test('rechaza un pago sin cuenta líquida de origen', () => {
    const pagos = crearFilasPagos([pago({ proximo_pago_id: 7 })], HOY, [cuenta()])

    const vacio = calcularPuestaAlDia(
      cuentas,
      [{ ...pagos[0], liquidar: true, cuentaOrigen: '' }],
      [1]
    )
    expect(vacio).toEqual({
      ok: false,
      error: 'Elige una cuenta de efectivo o débito para pagar "Renta".',
    })

    const tarjeta = calcularPuestaAlDia(
      cuentas,
      [{ ...pagos[0], liquidar: true, cuentaOrigen: '2' }],
      [1]
    )
    expect(tarjeta.ok).toBe(false)
  })

  test('rechaza saldos vacíos, inválidos o negativos', () => {
    expect(
      calcularPuestaAlDia([{ ...cuentas[0], saldoTexto: '  ' }], [], [1])
    ).toEqual({
      ok: false,
      error: 'Escribe el saldo real de Nómina.',
    })

    expect(
      calcularPuestaAlDia([{ ...cuentas[0], saldoTexto: 'abc' }], [], [1])
    ).toEqual({
      ok: false,
      error: 'El saldo de Nómina no es válido.',
    })

    expect(
      calcularPuestaAlDia([{ ...cuentas[0], saldoTexto: '-1' }], [], [1])
    ).toEqual({
      ok: false,
      error: 'El saldo de Nómina no puede ser negativo.',
    })
  })

  test('sin cambios no produce ajustes ni pagos', () => {
    const resultado = calcularPuestaAlDia(cuentas, [], [1, 3])

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.ajustes).toEqual([])
    expect(resultado.pagos).toEqual([])
    expect(resultado.resumen).toEqual({
      cuentasAjustadas: 0,
      pagosLiquidados: 0,
      totalAjustado: 0,
    })
    expect(resultado.hayCambios).toBe(false)
  })

  test('rechaza un pago seleccionado sin monto válido', () => {
    const pagos = crearFilasPagos([pago({ monto: 0 })], HOY, [cuenta()])

    expect(
      calcularPuestaAlDia(
        cuentas,
        [{ ...pagos[0], liquidar: true, cuentaOrigen: '1' }],
        [1]
      )
    ).toEqual({
      ok: false,
      error: 'El pago "Renta" no tiene un monto válido.',
    })
  })
})
