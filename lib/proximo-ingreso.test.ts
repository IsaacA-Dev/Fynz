import { describe, expect, test } from 'bun:test'
import { calcularDisponible, calcularHorizonte } from './horizonte'
import {
  FRECUENCIAS_PROXIMO_INGRESO,
  esFrecuenciaProximoIngreso,
  etiquetaFrecuenciaProximoIngreso,
  siguienteFechaProximoIngreso,
} from './proximo-ingreso'
import type { Cuenta } from './acciones'

const HOY = '2026-11-20'

function cuenta(saldo: number): Cuenta {
  return {
    cuenta_id: 1,
    nombre: 'Nómina',
    metodo: 'debito',
    balance_inicial: 0,
    saldo,
    dia_corte: null,
    dia_pago: null,
    limite: null,
  }
}

describe('frecuencias de próximo ingreso', () => {
  test('expone las tres opciones y sus etiquetas', () => {
    expect(FRECUENCIAS_PROXIMO_INGRESO.map((f) => f.etiqueta)).toEqual([
      'Una vez',
      'Semanal',
      'Quincenal',
    ])
    expect(esFrecuenciaProximoIngreso('semanal')).toBe(true)
    expect(esFrecuenciaProximoIngreso('mensual')).toBe(false)
    expect(etiquetaFrecuenciaProximoIngreso('quincenal')).toBe(
      'Quincenal'
    )
  })
})

describe('siguienteFechaProximoIngreso', () => {
  test('Una vez conserva la fecha aunque haya pasado', () => {
    expect(
      siguienteFechaProximoIngreso('2026-11-13', 'unica', HOY)
    ).toBe('2026-11-13')
    expect(
      siguienteFechaProximoIngreso('2026-11-27', 'unica', HOY)
    ).toBe('2026-11-27')
  })

  test('Semanal conserva hoy y fechas futuras', () => {
    expect(
      siguienteFechaProximoIngreso(HOY, 'semanal', HOY)
    ).toBe(HOY)
    expect(
      siguienteFechaProximoIngreso('2026-11-27', 'semanal', HOY)
    ).toBe('2026-11-27')
  })

  test('Semanal avanza una o varias semanas cuando la fecha pasó', () => {
    expect(
      siguienteFechaProximoIngreso('2026-11-19', 'semanal', HOY)
    ).toBe('2026-11-26')
    expect(
      siguienteFechaProximoIngreso('2026-11-13', 'semanal', HOY)
    ).toBe('2026-11-20')
    expect(
      siguienteFechaProximoIngreso('2026-11-12', 'semanal', HOY)
    ).toBe('2026-11-26')
    expect(
      siguienteFechaProximoIngreso('2026-10-30', 'semanal', HOY)
    ).toBe('2026-11-20')
  })

  test('Quincenal avanza una o varias quincenas cuando la fecha pasó', () => {
    expect(
      siguienteFechaProximoIngreso('2026-11-19', 'quincenal', HOY)
    ).toBe('2026-12-03')
    expect(
      siguienteFechaProximoIngreso('2026-11-06', 'quincenal', HOY)
    ).toBe('2026-11-20')
    expect(
      siguienteFechaProximoIngreso('2026-11-05', 'quincenal', HOY)
    ).toBe('2026-12-03')
    expect(
      siguienteFechaProximoIngreso('2026-10-23', 'quincenal', HOY)
    ).toBe('2026-11-20')
  })

  test('cruza correctamente el cambio de año', () => {
    expect(
      siguienteFechaProximoIngreso(
        '2026-12-31',
        'semanal',
        '2027-01-15'
      )
    ).toBe('2027-01-21')
  })

  test('tolera fechas nulas o inválidas', () => {
    expect(siguienteFechaProximoIngreso(null, 'semanal', HOY)).toBeNull()
    expect(
      siguienteFechaProximoIngreso('no-es-fecha', 'semanal', HOY)
    ).toBeNull()
  })
})

describe('regla financiera del horizonte', () => {
  test('avanzar la fecha no suma dinero al disponible', () => {
    const proximo = siguienteFechaProximoIngreso(
      '2026-10-30',
      'semanal',
      HOY
    )
    expect(proximo).toBe('2026-11-20')

    const horizonte = calcularHorizonte(
      {
        proximoIngreso: proximo,
        preferido: null,
        preferidoFecha: null,
      },
      HOY
    )
    const resultado = calcularDisponible(
      [cuenta(100000)],
      [],
      horizonte,
      HOY
    )

    expect(resultado.disponible).toBe(100000)
    expect(resultado.totalIncluido).toBe(0)
  })
})
