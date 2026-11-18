import { describe, expect, test } from 'bun:test'
import {
  TABLERO_DEFECTO,
  agregarFlujoMensual,
  cargaAcumulada,
  crearWidget,
  filtrarCuentasPorMetodo,
  filtrarPagosPorHorizonte,
  pagoMayor,
  reordenarLista,
  sanearTablero,
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
    dia_cobro: null,
    es_tarjeta: false,
    ...overrides,
  }
}

describe('sanearTablero', () => {
  test('por defecto no hay widgets (layout original en la primera sesión)', () => {
    expect(sanearTablero(undefined)).toEqual(TABLERO_DEFECTO)
    expect(sanearTablero(null)).toEqual(TABLERO_DEFECTO)
    expect(sanearTablero('texto')).toEqual(TABLERO_DEFECTO)
  })

  test('conserva instancias válidas con sus filtros', () => {
    const resultado = sanearTablero({
      widgets: [
        {
          key: 'a-1',
          tipo: 'carga-pagos',
          filtros: { horizonte: 15, metodo: 'tarjetas', meses: 6 },
        },
      ],
    })

    expect(resultado.widgets).toHaveLength(1)
    expect(resultado.widgets[0]).toEqual({
      key: 'a-1',
      tipo: 'carga-pagos',
      filtros: { horizonte: 15, metodo: 'tarjetas', meses: 6 },
    })
  })

  test('descarta tipos desconocidos y saneja filtros inválidos', () => {
    const resultado = sanearTablero({
      widgets: [
        { key: 'x', tipo: 'no-existe' },
        { key: 'y', tipo: 'flujo-mensual', filtros: { horizonte: 99, metodo: 'raro', meses: 12 } },
      ],
    })

    expect(resultado.widgets).toHaveLength(1)
    expect(resultado.widgets[0].tipo).toBe('flujo-mensual')
    expect(resultado.widgets[0].filtros).toEqual({ horizonte: null, metodo: 'todos', meses: 3 })
  })

  test('regenera claves duplicadas', () => {
    const resultado = sanearTablero({
      widgets: [
        { key: 'mismo', tipo: 'saldo-por-cuenta' },
        { key: 'mismo', tipo: 'saldo-por-cuenta' },
      ],
    })

    expect(resultado.widgets).toHaveLength(2)
    expect(resultado.widgets[0].key).not.toBe(resultado.widgets[1].key)
  })

  test('migra el shape anterior { activos, filtros }', () => {
    const resultado = sanearTablero({
      activos: ['saldo-por-cuenta', 'no-existe', 'carga-pagos'],
      filtros: { horizonte: 30, metodo: 'todos', meses: 3 },
    })

    expect(resultado.widgets).toHaveLength(2)
    expect(resultado.widgets[0]).toEqual({
      key: 'saldo-por-cuenta-0',
      tipo: 'saldo-por-cuenta',
      filtros: { horizonte: 30, metodo: 'todos', meses: 3 },
    })
    expect(resultado.widgets[1].tipo).toBe('carga-pagos')
  })
})

describe('crearWidget y reordenarLista', () => {
  test('crea instancias con claves únicas y filtros por defecto', () => {
    const a = crearWidget('saldo-por-cuenta')
    const b = crearWidget('saldo-por-cuenta')
    expect(a.tipo).toBe('saldo-por-cuenta')
    expect(a.key).not.toBe(b.key)
    expect(a.filtros).toEqual({ horizonte: null, metodo: 'todos', meses: 3 })
    expect(crearWidget('carga-pagos', { horizonte: 30 }).filtros.horizonte).toBe(30)
  })

  test('reordena la lista en ambos sentidos', () => {
    const lista = ['a', 'b', 'c']
    expect(reordenarLista(lista, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(reordenarLista(lista, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(reordenarLista(lista, 1, 1)).toEqual(lista)
    expect(reordenarLista(lista, 5, 0)).toEqual(lista)
    expect(reordenarLista(lista, 0, -1)).toEqual(lista)
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
      [
        { tipo: 'ingreso', monto: 50000, fecha: '2020-01-01' },
      ],
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
