import { describe, expect, test } from 'bun:test'
import {
  aDiaNumero,
  desdeFecha,
  esAtrasado,
  esAnteriorOIgual,
  fechaPagoTarjeta,
  formatearFecha,
  hoyLocal,
  siguienteDiaCobro,
  sumarDias,
} from './fechas'

describe('sumarDias', () => {
  test('cruza fin de mes y año sin desvíos', () => {
    expect(sumarDias('2026-01-31', 1)).toBe('2026-02-01')
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29')
  })

  test('tolera fecha ISO completa', () => {
    expect(sumarDias('2026-03-10T00:00:00.000Z', 5)).toBe('2026-03-15')
  })
})

describe('esAtrasado', () => {
  test('solo es atrasado cuando la fecha ya pasó (granularidad de día)', () => {
    expect(esAtrasado('2026-03-09', '2026-03-10')).toBe(true)
    expect(esAtrasado('2026-03-10', '2026-03-10')).toBe(false)
    expect(esAtrasado('2026-03-11', '2026-03-10')).toBe(false)
  })
})

describe('día numérico', () => {
  test('ordena cronológicamente por magnitud', () => {
    expect(aDiaNumero('2026-03-10')).toBeLessThan(aDiaNumero('2026-03-11'))
    expect(aDiaNumero('2026-03-31')).toBeLessThan(aDiaNumero('2026-04-01'))
    expect(aDiaNumero('2026-12-31')).toBeLessThan(aDiaNumero('2027-01-01'))
  })

  test('esAnteriorOIgual incluye igualdad', () => {
    expect(esAnteriorOIgual('2026-03-11', '2026-03-11')).toBe(true)
    expect(esAnteriorOIgual('2026-03-12', '2026-03-11')).toBe(false)
  })
})

describe('siguienteDiaCobro', () => {
  test('respeta el día de cobro dentro del mes', () => {
    expect(siguienteDiaCobro(15, '2026-03-10')).toBe('2026-03-15')
  })

  test('pasa al mes siguiente cuando el día ya ocurrió', () => {
    expect(siguienteDiaCobro(15, '2026-03-20')).toBe('2026-04-15')
  })

  test('cae el mismo día si coincide con la base', () => {
    expect(siguienteDiaCobro(15, '2026-03-15')).toBe('2026-03-15')
  })

  test('ajusta el día 29, 30 y 31 en meses cortos', () => {
    expect(siguienteDiaCobro(31, '2026-02-10')).toBe('2026-02-28')
    expect(siguienteDiaCobro(31, '2026-04-05')).toBe('2026-04-30')
  })

  test('cruza el año correctamente', () => {
    expect(siguienteDiaCobro(5, '2026-12-28')).toBe('2027-01-05')
  })

  test('bisiesto: 29 de febrero existe en bisiesto', () => {
    expect(siguienteDiaCobro(29, '2028-02-01')).toBe('2028-02-29')
    expect(siguienteDiaCobro(29, '2027-02-01')).toBe('2027-02-28')
  })
})

describe('fechaPagoTarjeta', () => {
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
    expect(fechaPagoTarjeta(31, 15, '2026-02-05')).toBe('2026-03-15')
  })

  test('el día del propio corte es tratado como siguiente ciclo', () => {
    expect(fechaPagoTarjeta(20, 28, '2026-03-20')).toBe('2026-03-28')
    expect(fechaPagoTarjeta(20, 12, '2026-03-20')).toBe('2026-04-12')
  })

  test('cruza el año', () => {
    expect(fechaPagoTarjeta(30, 15, '2026-12-31')).toBe('2027-02-15')
  })
})

describe('formatearFecha', () => {
  test('formatea sin usar zonas horarias', () => {
    expect(formatearFecha('2026-03-10')).toBe('10 mar')
    expect(formatearFecha('2026-03-10T23:00:00.000Z')).toBe('10 mar')
  })
})

describe('hoyLocal (utilidades)', () => {
  test('devuelve formato YYYY-MM-DD', () => {
    expect(hoyLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('desdeFecha compone partes', () => {
    expect(desdeFecha(2026, 3, 5)).toBe('2026-03-05')
  })
})
