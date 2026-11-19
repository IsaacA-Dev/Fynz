import { describe, expect, test } from 'bun:test'
import {
  esFrecuencia,
  esRecurrente,
  etiquetaFrecuencia,
  fechaInicialPago,
  siguienteVencimiento,
} from './recurrencia'

describe('esFrecuencia', () => {
  test('acepta las frecuencias soportadas', () => {
    expect(esFrecuencia('unico')).toBe(true)
    expect(esFrecuencia('semanal')).toBe(true)
    expect(esFrecuencia('quincenal')).toBe(true)
    expect(esFrecuencia('mensual')).toBe(true)
  })

  test('rechaza valores desconocidos', () => {
    expect(esFrecuencia('diario')).toBe(false)
    expect(esFrecuencia(null)).toBe(false)
    expect(esFrecuencia(undefined)).toBe(false)
  })
})

describe('esRecurrente', () => {
  test('solo único no es recurrente', () => {
    expect(esRecurrente('unico')).toBe(false)
    expect(esRecurrente('semanal')).toBe(true)
    expect(esRecurrente('quincenal')).toBe(true)
    expect(esRecurrente('mensual')).toBe(true)
  })
})

describe('siguienteVencimiento', () => {
  test('semanal suma 7 días y cruza mes y año', () => {
    expect(siguienteVencimiento('semanal', null, '2026-11-20')).toBe('2026-11-27')
    expect(siguienteVencimiento('semanal', null, '2026-12-29')).toBe('2027-01-05')
    expect(siguienteVencimiento('semanal', null, '2024-02-26')).toBe('2024-03-04')
  })

  test('quincenal suma 14 días y cruza mes y año', () => {
    expect(siguienteVencimiento('quincenal', null, '2026-11-20')).toBe('2026-12-04')
    expect(siguienteVencimiento('quincenal', null, '2026-12-25')).toBe('2027-01-08')
    expect(siguienteVencimiento('quincenal', null, '2024-02-20')).toBe('2024-03-05')
  })

  test('mensual conserva el día de cobro y ajusta meses cortos', () => {
    expect(siguienteVencimiento('mensual', 15, '2026-03-10')).toBe('2026-03-15')
    expect(siguienteVencimiento('mensual', 15, '2026-03-20')).toBe('2026-04-15')
    expect(siguienteVencimiento('mensual', 31, '2026-02-10')).toBe('2026-02-28')
    expect(siguienteVencimiento('mensual', 31, '2026-04-05')).toBe('2026-04-30')
    expect(siguienteVencimiento('mensual', 5, '2026-12-28')).toBe('2027-01-05')
    expect(siguienteVencimiento('mensual', 29, '2028-02-01')).toBe('2028-02-29')
  })

  test('único no genera siguiente periodo', () => {
    expect(siguienteVencimiento('unico', null, '2026-03-10')).toBeNull()
  })
})

describe('fechaInicialPago', () => {
  test('único, semanal y quincenal usan la fecha indicada', () => {
    expect(
      fechaInicialPago({
        frecuencia: 'unico',
        fechaVencimiento: '2026-11-20',
        hoy: '2026-11-19',
      })
    ).toBe('2026-11-20')

    expect(
      fechaInicialPago({
        frecuencia: 'semanal',
        fechaVencimiento: '2026-11-20T00:00:00',
        hoy: '2026-11-19',
      })
    ).toBe('2026-11-20')

    expect(
      fechaInicialPago({
        frecuencia: 'quincenal',
        fechaVencimiento: '2026-11-20',
        hoy: '2026-11-19',
      })
    ).toBe('2026-11-20')
  })

  test('mensual calcula el próximo día de cobro', () => {
    expect(
      fechaInicialPago({
        frecuencia: 'mensual',
        diaCobro: 15,
        hoy: '2026-03-10',
      })
    ).toBe('2026-03-15')

    expect(
      fechaInicialPago({
        frecuencia: 'mensual',
        diaCobro: 15,
        hoy: '2026-03-20',
      })
    ).toBe('2026-04-15')
  })

  test('la reprogramación de una instancia tiene prioridad', () => {
    expect(
      fechaInicialPago({
        frecuencia: 'mensual',
        diaCobro: 15,
        hoy: '2026-03-10',
        reprogramarFecha: '2026-03-18',
      })
    ).toBe('2026-03-18')
  })
})

describe('etiquetaFrecuencia', () => {
  test('describe cada frecuencia', () => {
    expect(etiquetaFrecuencia('semanal', null)).toBe('Cada semana')
    expect(etiquetaFrecuencia('quincenal', null)).toBe('Cada 2 semanas')
    expect(etiquetaFrecuencia('mensual', 25)).toBe('Repite día 25')
    expect(etiquetaFrecuencia('mensual', null)).toBe('Mensual')
    expect(etiquetaFrecuencia('unico', null)).toBe('Único')
  })
})
