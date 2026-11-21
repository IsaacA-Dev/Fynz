import { describe, expect, test } from 'bun:test'
import { impactoCompra } from './simulador'
import { calcularHorizonte } from './horizonte'
import type { Cuenta, ProximoPago } from './acciones'

function cuenta(overrides: Partial<Cuenta> = {}): Cuenta {
  return {
    cuenta_id: 1,
    nombre: 'Débito',
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
    descripcion: 'Renta',
    monto: 0,
    fecha_vencimiento: '2026-03-15',
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

const HOY = '2026-03-10'
const horizonte = calcularHorizonte(
  { proximoIngreso: null, preferido: 30, preferidoFecha: null },
  HOY
)

describe('impactoCompra — líquido', () => {
  test('el Disponible Real baja exactamente lo que se gasta', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 100000 })]
    const resultado = impactoCompra({
      monto: 25000,
      cuentaId: 1,
      cuentas,
      pagos: [],
      horizonte,
      disponibleReal: 100000,
      hoy: HOY,
    })

    expect(resultado).toMatchObject({
      tipo: 'liquido',
      disponibleAntes: 100000,
      disponibleDespues: 75000,
      alertas: [],
    })
  })

  test('avisa con el faltante si el domiciliado de esa cuenta no alcanza', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 30000 })]
    const pagos = [
      pago({ monto: 20000, fecha_vencimiento: '2026-03-15', domiciliado: true, cuenta_id: 1 }),
    ]
    const resultado = impactoCompra({
      monto: 25000,
      cuentaId: 1,
      cuentas,
      pagos,
      horizonte,
      disponibleReal: 30000,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('liquido')
    if (resultado?.tipo !== 'liquido') return
    expect(resultado.alertas).toHaveLength(1)
    expect(resultado.alertas[0]).toMatchObject({
      cuentaNombre: 'Débito',
      faltante: 15000,
    })
  })

  test('efectivo sin domiciliados: solo baja el disponible', () => {
    const cuentas = [
      cuenta({ cuenta_id: 1, metodo: 'efectivo', nombre: 'Efectivo', saldo: 50000 }),
    ]
    const resultado = impactoCompra({
      monto: 12000,
      cuentaId: 1,
      cuentas,
      pagos: [],
      horizonte,
      disponibleReal: 50000,
      hoy: HOY,
    })

    expect(resultado).toMatchObject({
      tipo: 'liquido',
      disponibleDespues: 38000,
      alertas: [],
    })
  })
})

describe('impactoCompra — tarjeta', () => {
  test('la deuda sube sin tocar la liquidez', () => {
    const cuentas = [
      cuenta({ cuenta_id: 1, saldo: 200000, metodo: 'debito', nombre: 'Débito' }),
      cuenta({ cuenta_id: 2, saldo: 80000, metodo: 'credito', nombre: 'Visa' }),
    ]
    const resultado = impactoCompra({
      monto: 20000,
      cuentaId: 2,
      cuentas,
      pagos: [],
      horizonte,
      disponibleReal: 200000,
      hoy: HOY,
    })

    expect(resultado).toMatchObject({
      tipo: 'credito',
      deudaAntes: 80000,
      deudaDespues: 100000,
      liquididadSinCambio: true,
    })
  })

  test('indica el vencimiento del ciclo que recibe la compra', () => {
    const cuentas = [
      cuenta({
        cuenta_id: 2,
        saldo: 40000,
        metodo: 'credito',
        nombre: 'Visa',
        dia_corte: 20,
        dia_pago: 28,
      }),
    ]
    const resultado = impactoCompra({
      monto: 15000,
      cuentaId: 2,
      cuentas,
      pagos: [],
      horizonte,
      disponibleReal: 0,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('credito')
    if (resultado?.tipo !== 'credito') return
    // Compra el 10/03: pertenece al ciclo que corta el 20/03 y vence el 28/03.
    expect(resultado.vencimientoCiclo).toBe('2026-03-28')
  })

  test('sin ciclo definido no hay fecha de vencimiento', () => {
    const cuentas = [cuenta({ cuenta_id: 2, saldo: 40000, metodo: 'credito', nombre: 'Visa' })]
    const resultado = impactoCompra({
      monto: 15000,
      cuentaId: 2,
      cuentas,
      pagos: [],
      horizonte,
      disponibleReal: 0,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('credito')
    if (resultado?.tipo !== 'credito') return
    expect(resultado.vencimientoCiclo).toBeNull()
  })
})

describe('impactoCompra — horizonte afectado (tarjeta)', () => {
  test('si el ciclo vence dentro del horizonte, reporta el disponible después', () => {
    const cuentas = [
      cuenta({ cuenta_id: 1, saldo: 200000, metodo: 'debito', nombre: 'Débito' }),
      cuenta({
        cuenta_id: 2,
        saldo: 40000,
        metodo: 'credito',
        nombre: 'Visa',
        dia_corte: 20,
        dia_pago: 28,
      }),
    ]
    const resultado = impactoCompra({
      monto: 15000,
      cuentaId: 2,
      cuentas,
      pagos: [],
      horizonte,
      disponibleReal: 200000,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('credito')
    if (resultado?.tipo !== 'credito') return
    expect(resultado.vencimientoCiclo).toBe('2026-03-28')
    expect(resultado.dentroDelHorizonte).toBe(true)
    expect(resultado.disponibleDespues).toBe(185000)
  })

  test('si el ciclo vence fuera, lo dice y no baja el disponible', () => {
    const horizonteCorto = calcularHorizonte(
      { proximoIngreso: null, preferido: null, preferidoFecha: '2026-03-15' },
      HOY
    )
    const cuentas = [
      cuenta({
        cuenta_id: 2,
        saldo: 40000,
        metodo: 'credito',
        nombre: 'Visa',
        dia_corte: 20,
        dia_pago: 28,
      }),
    ]
    const resultado = impactoCompra({
      monto: 15000,
      cuentaId: 2,
      cuentas,
      pagos: [],
      horizonte: horizonteCorto,
      disponibleReal: 50000,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('credito')
    if (resultado?.tipo !== 'credito') return
    expect(resultado.dentroDelHorizonte).toBe(false)
    expect(resultado.disponibleDespues).toBeNull()
  })

  test('reemplaza el compromiso existente del ciclo en vez de duplicarlo', () => {
    const cuentas = [
      cuenta({ cuenta_id: 1, saldo: 100000, metodo: 'debito', nombre: 'Débito' }),
      cuenta({
        cuenta_id: 2,
        saldo: 40000,
        metodo: 'credito',
        nombre: 'Visa',
        dia_corte: 20,
        dia_pago: 28,
      }),
    ]
    const compromisoExistente = pago({
      proximo_pago_id: 7,
      descripcion: 'Pago estimado de la tarjeta Visa · Ciclo 20 mar',
      monto: 40000,
      fecha_vencimiento: '2026-03-28',
      es_tarjeta: true,
      cuenta_id: 2,
    })
    const resultado = impactoCompra({
      monto: 15000,
      cuentaId: 2,
      cuentas,
      pagos: [compromisoExistente],
      horizonte,
      disponibleReal: 100000,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('credito')
    if (resultado?.tipo !== 'credito') return
    // 55000 = 40000 previo + 15000 de la compra simulada (sin duplicar).
    expect(resultado.montoCompromiso).toBe(55000)
    expect(resultado.disponibleDespues).toBe(100000 - 55000)
  })
})

describe('impactoCompra — casos nulos', () => {
  test('sin monto o sin cuenta no calcula', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 100000 })]
    expect(
      impactoCompra({
        monto: 0,
        cuentaId: 1,
        cuentas,
        pagos: [],
        horizonte,
        disponibleReal: 100000,
        hoy: HOY,
      })
    ).toBeNull()
    expect(
      impactoCompra({
        monto: 5000,
        cuentaId: 999,
        cuentas,
        pagos: [],
        horizonte,
        disponibleReal: 100000,
        hoy: HOY,
      })
    ).toBeNull()
  })
})

describe('impactoCompra — alertas dentro de la semana activa', () => {
  const horizonteAuto = calcularHorizonte(
    { proximoIngreso: null, preferido: null, preferidoFecha: null },
    HOY
  )

  test('no alerta por un domiciliado posterior al corte semanal', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 30000 })]
    const pagos = [
      pago({
        monto: 20000,
        fecha_vencimiento: '2026-03-25',
        domiciliado: true,
        cuenta_id: 1,
      }),
    ]

    const resultado = impactoCompra({
      monto: 25000,
      cuentaId: 1,
      cuentas,
      pagos,
      horizonte: horizonteAuto,
      disponibleReal: 30000,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('liquido')
    if (resultado?.tipo !== 'liquido') return
    expect(resultado.alertas).toEqual([])
  })

  test('sí alerta si el domiciliado cae antes del corte semanal', () => {
    const cuentas = [cuenta({ cuenta_id: 1, saldo: 30000 })]
    const pagos = [
      pago({
        monto: 20000,
        fecha_vencimiento: '2026-03-15',
        domiciliado: true,
        cuenta_id: 1,
      }),
    ]

    const resultado = impactoCompra({
      monto: 25000,
      cuentaId: 1,
      cuentas,
      pagos,
      horizonte: horizonteAuto,
      disponibleReal: 30000,
      hoy: HOY,
    })

    expect(resultado?.tipo).toBe('liquido')
    if (resultado?.tipo !== 'liquido') return
    expect(resultado.alertas).toHaveLength(1)
    expect(resultado.alertas[0].faltante).toBe(15000)
  })
})
