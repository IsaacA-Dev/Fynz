import { describe, expect, test } from 'bun:test'
import {
  agregarFlujoMensual,
  cargaAcumulada,
  columnasWidgets,
  filtrarCuentasPorMetodo,
  filtrarPagosPorHorizonte,
  pagoMayor,
  sanearWidgetsActivos,
} from './tablero'
import type { Cuenta, ProximoPago } from './acciones'

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

describe('sanearWidgetsActivos', () => {
  test('acepta la forma nueva { activos } y descarta desconocidos', () => {
    expect(
      sanearWidgetsActivos({
        activos: ['carga-pagos', 'no-existe', 'saldo-por-cuenta'],
      })
    ).toEqual(['saldo-por-cuenta', 'carga-pagos'])
  })

  test('migra el shape legado { widgets: [{ tipo }] }', () => {
    expect(
      sanearWidgetsActivos({
        widgets: [
          { key: 'a', tipo: 'carga-pagos' },
          { key: 'b', tipo: 'flujo-mensual' },
          { key: 'c', tipo: 'no-existe' },
        ],
      })
    ).toEqual(['flujo-mensual', 'carga-pagos'])
  })

  test('elimina duplicados y ordena según el catálogo', () => {
    expect(
      sanearWidgetsActivos({
        activos: ['promedio-diario', 'saldo-por-cuenta', 'promedio-diario'],
      })
    ).toEqual(['saldo-por-cuenta', 'promedio-diario'])
  })

  test('sin datos o con valores inválidos devuelve una lista vacía', () => {
    expect(sanearWidgetsActivos(undefined)).toEqual([])
    expect(sanearWidgetsActivos(null)).toEqual([])
    expect(sanearWidgetsActivos('texto')).toEqual([])
    expect(sanearWidgetsActivos({ activos: 'no-es-array' })).toEqual([])
  })
})

describe('columnasWidgets', () => {
  test('distribuye la franja de widgets', () => {
    expect(columnasWidgets(0)).toBe(1)
    expect(columnasWidgets(1)).toBe(1)
    expect(columnasWidgets(2)).toBe(2)
    expect(columnasWidgets(3)).toBe(3)
    expect(columnasWidgets(4)).toBe(2)
    expect(columnasWidgets(5)).toBe(3)
    expect(columnasWidgets(6)).toBe(3)
  })
})

describe('agregarFlujoMensual', () => {
  test('agrupa movimientos por mes (fechas de calendario) y devuelve el periodo pedido', () => {
    const resultado = agregarFlujoMensual(
      [
        { tipo: 'ingreso', monto: 100000, fecha: '2026-03-10' },
        { tipo: 'egreso', monto: 40000, fecha: '2026-03-20' },
        { tipo: 'ingreso', monto: 90000, fecha: '2026-04-02' },
        { tipo: 'egreso', monto: 5000, fecha: '2026-05-25' },
      ],
      3,
      '2026-05-15'
    )

    expect(resultado).toHaveLength(3)
    expect(resultado[0].mes).toBe('2026-03')
    expect(resultado[0]).toEqual({ mes: '2026-03', ingresos: 100000, egresos: 40000 })
    expect(resultado[2]).toEqual({ mes: '2026-05', ingresos: 0, egresos: 5000 })
  })

  test('ignora movimientos fuera del periodo', () => {
    const resultado = agregarFlujoMensual(
      [{ tipo: 'ingreso', monto: 50000, fecha: '2020-01-01' }],
      1,
      '2026-05-15'
    )
    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toEqual({ mes: '2026-05', ingresos: 0, egresos: 0 })
  })

  test('aplica la misma clave de mes a fechas ISO con hora', () => {
    const resultado = agregarFlujoMensual(
      [{ tipo: 'egreso', monto: 5000, fecha: '2026-03-20T12:00:00.000Z' }],
      1,
      '2026-03-30'
    )
    expect(resultado[0].egresos).toBe(5000)
  })

  test('cruza el cambio de año sin romper los buckets', () => {
    const resultado = agregarFlujoMensual(
      [
        { tipo: 'ingreso', monto: 100000, fecha: '2025-12-28' },
        { tipo: 'ingreso', monto: 200000, fecha: '2026-01-03' },
      ],
      2,
      '2026-01-10'
    )
    expect(resultado.map((r) => r.mes)).toEqual(['2025-12', '2026-01'])
    expect(resultado[0].ingresos).toBe(100000)
    expect(resultado[1].ingresos).toBe(200000)
  })
})

describe('filtros del tablero', () => {
  test('filtrar cuentas por método', () => {
    const cuentas = [
      cuenta({ cuenta_id: 1, metodo: 'debito' }),
      cuenta({ cuenta_id: 2, metodo: 'efectivo' }),
      cuenta({ cuenta_id: 3, metodo: 'credito' }),
    ]

    expect(filtrarCuentasPorMetodo(cuentas, 'todos')).toHaveLength(3)
    expect(filtrarCuentasPorMetodo(cuentas, 'liquido').map((c) => c.cuenta_id)).toEqual([1, 2])
    expect(filtrarCuentasPorMetodo(cuentas, 'tarjetas').map((c) => c.cuenta_id)).toEqual([3])
  })

  test('filtrar pagos por horizonte y descartar pagados', () => {
    const pagos = [
      pago({ proximo_pago_id: 1, fecha_vencimiento: '2026-03-18' }),
      pago({ proximo_pago_id: 2, fecha_vencimiento: '2026-03-25' }),
      pago({ proximo_pago_id: 3, fecha_vencimiento: '2026-04-10' }),
      pago({ proximo_pago_id: 4, fecha_vencimiento: '2026-03-20', pagado: true }),
    ]

    const resultado = filtrarPagosPorHorizonte(pagos, 15, '2026-03-10')
    expect(resultado.map((p) => p.proximo_pago_id)).toEqual([1, 2])

    const completos = filtrarPagosPorHorizonte(pagos, null, '2026-03-10')
    expect(completos.map((p) => p.proximo_pago_id)).toEqual([1, 2, 3])
  })
})

describe('carga acumulada', () => {
  test('ordena por fecha y acumula correctamente', () => {
    const pagos = [
      pago({ proximo_pago_id: 1, monto: 10000, fecha_vencimiento: '2026-06-20' }),
      pago({ proximo_pago_id: 2, monto: 25000, fecha_vencimiento: '2026-06-10' }),
      pago({ proximo_pago_id: 3, monto: 15000, fecha_vencimiento: '2026-06-15' }),
    ]

    const puntos = cargaAcumulada(pagos)
    expect(puntos.map((p) => p.acumulado)).toEqual([25000, 40000, 50000])
    expect(puntos[0].fecha).toBe('2026-06-10')
  })

  test('identifica el pago individual más grande', () => {
    const pagos = [
      pago({ monto: 10000 }),
      pago({ proximo_pago_id: 9, monto: 99900 }),
    ]
    expect(pagoMayor(pagos)?.proximo_pago_id).toBe(9)
    expect(pagoMayor([])).toBeNull()
  })
})
