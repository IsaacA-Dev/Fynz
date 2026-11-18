import { describe, expect, test } from 'bun:test'
import { ciclosDeTarjeta, compromisosDeseados } from './ciclos-tarjeta'
import type { MovimientoTarjeta, TarjetaCiclos } from './ciclos-tarjeta'
import type { TipoMovimiento } from './acciones'

function tarjeta(overrides: Partial<TarjetaCiclos> = {}): TarjetaCiclos {
  return {
    diaCorte: 20,
    diaPago: 28,
    balanceInicial: 0,
    fechaInicio: '2026-03-10',
    nombre: 'Visa',
    ...overrides,
  }
}

function mov(
  tipo: TipoMovimiento,
  monto: number,
  fecha: string
): MovimientoTarjeta {
  return { tipo, monto, fecha }
}

describe('ciclosDeTarjeta — asignación de compras', () => {
  test('sin ciclo definido no hay ciclos', () => {
    const ciclos = ciclosDeTarjeta(tarjeta({ diaCorte: null, diaPago: null }), [], '2026-03-10')
    expect(ciclos).toHaveLength(0)
  })

  test('una compra antes del corte se asigna al corte del mes', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 100000, '2026-03-05')],
      '2026-03-10'
    )

    expect(ciclos[0]).toMatchObject({
      fechaCorte: '2026-03-20',
      compras: 100000,
      objetivo: 100000,
      estado: 'abierto',
    })
    expect(ciclos[0].fechaPago).toBe('2026-03-28')
  })

  test('una compra después del corte pertenece al siguiente ciclo', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 50000, '2026-03-25')],
      '2026-03-25'
    )

    expect(ciclos[1]).toMatchObject({
      fechaCorte: '2026-04-20',
      compras: 50000,
      estado: 'abierto',
    })
    expect(ciclos[0].compras).toBe(0)
  })

  test('una compra el día exacto del corte va al siguiente ciclo', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 75000, '2026-03-20')],
      '2026-03-20'
    )

    expect(ciclos[0].fechaCorte).toBe('2026-03-20')
    expect(ciclos[1].compras).toBe(75000)
  })

  test('la deuda inicial (balance_inicial) queda en su propio ciclo', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta({ balanceInicial: 90000 }),
      [],
      '2026-04-30'
    )

    expect(ciclos[0]).toMatchObject({
      fechaCorte: '2026-03-20',
      compras: 90000,
      estado: 'cerrado',
    })
  })
})

describe('ciclosDeTarjeta — pagos', () => {
  const base = [
    mov('egreso', 100000, '2026-03-05'),
    mov('egreso', 60000, '2026-04-05'),
  ]

  test('un pago parcial reduce el ciclo más viejo', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [...base, mov('ingreso', 30000, '2026-04-10')],
      '2026-04-30'
    )

    expect(ciclos[0]).toMatchObject({ fechaCorte: '2026-03-20', objetivo: 70000, pagos: 30000 })
    expect(ciclos[1]).toMatchObject({ fechaCorte: '2026-04-20', objetivo: 60000 })
  })

  test('el sobrante de un pago pasa al siguiente ciclo con deuda', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [...base, mov('ingreso', 80000, '2026-04-10')],
      '2026-04-30'
    )

    expect(ciclos[0].objetivo).toBe(20000)
    expect(ciclos[1].objetivo).toBe(60000)
    ciclos[1].objetivo = ciclos[1].objetivo
  })

  test('el pago total liquida el ciclo y no genera objetivo negativo', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [...base, mov('ingreso', 160000, '2026-04-10')],
      '2026-04-30'
    )

    expect(ciclos.every((c) => c.objetivo === 0)).toBe(true)
  })

  test('dos pagos amortiguan los ciclos en orden', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [...base, mov('ingreso', 100000, '2026-04-10'), mov('ingreso', 40000, '2026-04-15')],
      '2026-04-30'
    )

    expect(ciclos[0].objetivo).toBe(0)
    expect(ciclos[1].objetivo).toBe(20000)
  })
})

describe('fechas límite y casos raros', () => {
  test('corte 31 en febrero se ajusta a fin de mes', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta({ diaCorte: 31, diaPago: 28, balanceInicial: 20000, fechaInicio: '2026-02-10' }),
      [],
      '2026-02-20'
    )

    expect(ciclos[0].fechaCorte).toBe('2026-02-28')
    expect(ciclos[0].objetivo).toBe(20000)
  })

  test('cruce de año en el pago del ciclo', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta({ diaCorte: 30, diaPago: 15, fechaInicio: '2026-11-01' }),
      [mov('egreso', 40000, '2026-12-20')],
      '2026-12-25'
    )

    expect(ciclos.length).toBe(2)
    expect(ciclos[1]).toMatchObject({ fechaCorte: '2026-12-30', compras: 40000 })
    expect(ciclos[1].fechaPago).toBe('2027-01-15')
  })

  test('solo muestra ciclos generados hasta el siguiente corte', () => {
    const ciclos = ciclosDeTarjeta(tarjeta(), [], '2026-03-10')
    expect(ciclos.map((c) => c.fechaCorte)).toEqual(['2026-03-20'])
  })
})

describe('override manual y mínimo', () => {
  test('un objetivo manual reemplaza el efectivo y conserva el real', () => {
    const guardados = new Map([['2026-03-20', { objetivoManual: 50000, minimo: 2500 }]])
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 100000, '2026-03-05')],
      '2026-03-10',
      guardados
    )

    expect(ciclos[0]).toMatchObject({
      objetivoReal: 100000,
      objetivoManual: 50000,
      objetivo: 50000,
      minimo: 2500,
    })
  })

  test('un manual mayor al real también se respeta (pagar más del ciclo)', () => {
    const guardados = new Map([['2026-03-20', { objetivoManual: 150000, minimo: 0 }]])
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 100000, '2026-03-05')],
      '2026-03-10',
      guardados
    )
    expect(ciclos[0].objetivo).toBe(150000)
  })

  test('sin datos guardados: objetivo real y mínimo 0', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 100000, '2026-03-05')],
      '2026-03-10'
    )
    expect(ciclos[0]).toMatchObject({
      objetivoReal: 100000,
      objetivoManual: null,
      objetivo: 100000,
      minimo: 0,
    })
  })

  test('los compromisos usan el objetivo efectivo (con manual)', () => {
    const guardados = new Map([['2026-03-20', { objetivoManual: 30000, minimo: 1500 }]])
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 100000, '2026-03-05')],
      '2026-04-25',
      guardados
    )

    const compromisos = compromisosDeseados(ciclos, 'Visa', '2026-04-25')
    expect(compromisos[0].monto).toBe(30000)
  })
})

describe('compromisosDeseados', () => {
  test('solo genera compromisos de ciclos con corte ya pasado y deuda', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [
        mov('egreso', 100000, '2026-03-05'),
        mov('egreso', 50000, '2026-03-25'),
      ],
      '2026-03-25'
    )

    const compromisos = compromisosDeseados(ciclos, 'Visa', '2026-03-25')

    expect(compromisos).toHaveLength(1)
    expect(compromisos[0]).toMatchObject({
      monto: 100000,
      fechaVencimiento: '2026-03-28',
      diaCobro: 28,
    })
    expect(compromisos[0].descripcion).toContain('Ciclo 20 mar')
    expect(compromisos[0].descripcion).toContain('Visa')
  })

  test('no hay compromiso si la deuda quedó pagada', () => {
    const ciclos = ciclosDeTarjeta(
      tarjeta(),
      [mov('egreso', 100000, '2026-03-05'), mov('ingreso', 100000, '2026-03-24')],
      '2026-03-25'
    )

    expect(compromisosDeseados(ciclos, 'Visa', '2026-03-25')).toHaveLength(0)
  })
})
