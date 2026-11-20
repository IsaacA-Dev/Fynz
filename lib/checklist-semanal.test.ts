import { describe, expect, test } from 'bun:test'
import type { Cuenta, ProximoPago } from './acciones'
import { calcularDisponible, calcularHorizonte } from './horizonte'
import {
  cuentaSugeridaChecklist,
  esPagoEnChecklistSemanal,
  pagosParaProximos,
  pagosSemanalesEnVentana,
  requiereSelectorCuenta,
} from './checklist-semanal'

const HOY = '2026-11-20'

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
    descripcion: 'Comedor',
    monto: 37500,
    fecha_vencimiento: '2026-11-20',
    pagado: false,
    domiciliado: false,
    cuenta_id: null,
    cuenta_nombre: null,
    recurrente: true,
    frecuencia: 'semanal',
    dia_cobro: null,
    es_tarjeta: false,
    ...overrides,
  }
}

describe('esPagoEnChecklistSemanal', () => {
  test('incluye vencidos, hoy y hasta hoy + 2', () => {
    expect(esPagoEnChecklistSemanal(pago({ fecha_vencimiento: '2026-11-13' }), HOY)).toBe(true)
    expect(esPagoEnChecklistSemanal(pago({ fecha_vencimiento: '2026-11-20' }), HOY)).toBe(true)
    expect(esPagoEnChecklistSemanal(pago({ fecha_vencimiento: '2026-11-21' }), HOY)).toBe(true)
    expect(esPagoEnChecklistSemanal(pago({ fecha_vencimiento: '2026-11-22' }), HOY)).toBe(true)
  })

  test('excluye hoy + 3 y fechas futuras', () => {
    expect(esPagoEnChecklistSemanal(pago({ fecha_vencimiento: '2026-11-23' }), HOY)).toBe(false)
    expect(esPagoEnChecklistSemanal(pago({ fecha_vencimiento: '2026-11-27' }), HOY)).toBe(false)
  })

  test('excluye pagados, tarjetas y otras frecuencias', () => {
    expect(esPagoEnChecklistSemanal(pago({ pagado: true }), HOY)).toBe(false)
    expect(esPagoEnChecklistSemanal(pago({ es_tarjeta: true }), HOY)).toBe(false)
    expect(esPagoEnChecklistSemanal(pago({ frecuencia: 'mensual' }), HOY)).toBe(false)
    expect(esPagoEnChecklistSemanal(pago({ frecuencia: 'quincenal' }), HOY)).toBe(false)
    expect(esPagoEnChecklistSemanal(pago({ frecuencia: 'unico' }), HOY)).toBe(false)
  })
})

describe('pagosSemanalesEnVentana', () => {
  test('filtra, incluye vencidos y ordena por fecha', () => {
    const pagos = [
      pago({ proximo_pago_id: 1, descripcion: 'Futuro', fecha_vencimiento: '2026-11-27' }),
      pago({ proximo_pago_id: 2, descripcion: 'Hoy', fecha_vencimiento: '2026-11-20' }),
      pago({ proximo_pago_id: 3, descripcion: 'Vencido', fecha_vencimiento: '2026-11-13' }),
      pago({ proximo_pago_id: 4, descripcion: '+2', fecha_vencimiento: '2026-11-22' }),
      pago({ proximo_pago_id: 5, descripcion: 'Mensual', frecuencia: 'mensual' }),
    ]

    expect(
      pagosSemanalesEnVentana(pagos, HOY).map((item) => item.descripcion)
    ).toEqual(['Vencido', 'Hoy', '+2'])
  })
})

describe('pagosParaProximos', () => {
  test('quita solo los del checklist y no muta el arreglo original', () => {
    const enChecklist = pago({ proximo_pago_id: 1, descripcion: 'En checklist' })
    const futuro = pago({
      proximo_pago_id: 2,
      descripcion: 'Futuro',
      fecha_vencimiento: '2026-11-27',
    })
    const mensual = pago({
      proximo_pago_id: 3,
      descripcion: 'Mensual',
      frecuencia: 'mensual',
      dia_cobro: 25,
    })
    const pagos = [enChecklist, futuro, mensual]

    const resultado = pagosParaProximos(pagos, HOY)

    expect(resultado.map((item) => item.descripcion)).toEqual([
      'Futuro',
      'Mensual',
    ])
    expect(pagos).toHaveLength(3)
  })
})

describe('cuentaSugeridaChecklist', () => {
  const nomina = cuenta({ cuenta_id: 1, nombre: 'Nómina' })
  const efectivo = cuenta({ cuenta_id: 2, nombre: 'Efectivo', metodo: 'efectivo' })
  const tarjeta = cuenta({
    cuenta_id: 3,
    nombre: 'Tarjeta',
    metodo: 'credito',
    saldo: 30000,
  })

  test('usa la cuenta domiciliada si es líquida y activa', () => {
    expect(
      cuentaSugeridaChecklist(
        pago({ domiciliado: true, cuenta_id: 2 }),
        [nomina, efectivo, tarjeta]
      )
    ).toBe(2)
  })

  test('cae en la primera líquida si la domiciliada no es válida', () => {
    expect(
      cuentaSugeridaChecklist(
        pago({ domiciliado: true, cuenta_id: 99 }),
        [nomina, efectivo, tarjeta]
      )
    ).toBe(1)
  })

  test('con una sola líquida la usa; sin líquidas devuelve null', () => {
    expect(cuentaSugeridaChecklist(pago(), [nomina, tarjeta])).toBe(1)
    expect(cuentaSugeridaChecklist(pago(), [tarjeta])).toBeNull()
  })
})

describe('requiereSelectorCuenta', () => {
  const nomina = cuenta({ cuenta_id: 1 })
  const efectivo = cuenta({ cuenta_id: 2, metodo: 'efectivo' })
  const tarjeta = cuenta({ cuenta_id: 3, metodo: 'credito' })

  test('no requiere selector con una sola líquida', () => {
    expect(requiereSelectorCuenta(pago(), [nomina, tarjeta])).toBe(false)
  })

  test('requiere selector con varias líquidas', () => {
    expect(requiereSelectorCuenta(pago(), [nomina, efectivo, tarjeta])).toBe(true)
  })

  test('no requiere selector si hay una domiciliada válida', () => {
    expect(
      requiereSelectorCuenta(
        pago({ domiciliado: true, cuenta_id: 2 }),
        [nomina, efectivo, tarjeta]
      )
    ).toBe(false)
  })
})

describe('coherencia con el Disponible Real', () => {
  test('el checklist no elimina pagos del cálculo financiero', () => {
    const horizonte = calcularHorizonte(
      { proximoIngreso: null, preferido: 30, preferidoFecha: null },
      HOY
    )
    const cuentas = [cuenta({ saldo: 100000 })]
    const enChecklist = pago({
      proximo_pago_id: 1,
      monto: 15000,
      fecha_vencimiento: HOY,
    })
    const siguiente = pago({
      proximo_pago_id: 2,
      monto: 15000,
      fecha_vencimiento: '2026-11-27',
    })
    const pagos = [enChecklist, siguiente]

    expect(pagosParaProximos(pagos, HOY)).toHaveLength(1)
    expect(pagos).toHaveLength(2)

    const resultado = calcularDisponible(cuentas, pagos, horizonte, HOY)
    expect(resultado.totalIncluido).toBe(30000)
    expect(resultado.disponible).toBe(70000)
  })
})
