import { describe, expect, test } from 'bun:test'
import { aCentavos, centavosACadena, formatearCentavos, parseCentavos } from './dinero'

describe('parseCentavos', () => {
  test('interpreta decimales como centavos', () => {
    expect(parseCentavos('123.45')).toBe(12345)
    expect(parseCentavos('100')).toBe(10000)
    expect(parseCentavos('0.29')).toBe(29)
    expect(parseCentavos('0')).toBe(0)
    expect(parseCentavos('999.99')).toBe(99999)
  })

  test('acepta coma como separador decimal', () => {
    expect(parseCentavos('1,99')).toBe(199)
  })

  test('redondea el tercer decimal', () => {
    expect(parseCentavos('0.004')).toBe(0)
    expect(parseCentavos('0.009')).toBe(1)
    expect(parseCentavos('1.009')).toBe(101)
  })

  test('rechaza entradas inválidas', () => {
    expect(() => parseCentavos('')).toThrow()
    expect(() => parseCentavos('abc')).toThrow()
    expect(() => parseCentavos('-1')).not.toThrow()
    expect(() => parseCentavos('10,340.55')).not.toThrow()
  })
})

describe('aCentavos', () => {
  test('entero preserva el valor (bigint de la BD)', () => {
    expect(aCentavos(12345)).toBe(12345)
    expect(aCentavos(0)).toBe(0)
  })

  test('float se convierte a centavos', () => {
    expect(aCentavos(123.45)).toBe(12345)
  })

  test('null y vacío a 0', () => {
    expect(aCentavos(null)).toBe(0)
    expect(aCentavos('')).toBe(0)
    expect(aCentavos(undefined)).toBe(0)
  })
})

describe('formatearCentavos', () => {
  test('formatea centavos a decimales sin float', () => {
    expect(formatearCentavos(12345)).toBe('123.45')
    expect(formatearCentavos(29)).toBe('0.29')
    expect(formatearCentavos(0)).toBe('0.00')
  })

  test('negativos y miles', () => {
    expect(formatearCentavos(-12345)).toBe('-123.45')
    expect(formatearCentavos(100000)).toBe('1,000.00')
  })

  test('centavosACadena sin separador de miles', () => {
    expect(centavosACadena(12345)).toBe('123.45')
    expect(centavosACadena(29)).toBe('0.29')
    expect(centavosACadena(0)).toBe('0.00')
  })
})
