import { describe, expect, test } from 'bun:test'
import { coincideTexto, enRangoFecha } from './historial'

describe('enRangoFecha', () => {
  test('sin límites todo entra', () => {
    expect(enRangoFecha('2026-03-10', null, null)).toBe(true)
  })

  test('respeta rango inclusivo', () => {
    expect(enRangoFecha('2026-03-10', '2026-03-01', '2026-03-31')).toBe(true)
    expect(enRangoFecha('2026-03-01', '2026-03-01', '2026-03-31')).toBe(true)
    expect(enRangoFecha('2026-03-31', '2026-03-01', '2026-03-31')).toBe(true)
  })

  test('fuera del rango se excluye', () => {
    expect(enRangoFecha('2026-02-28', '2026-03-01', '2026-03-31')).toBe(false)
    expect(enRangoFecha('2026-04-01', '2026-03-01', '2026-03-31')).toBe(false)
  })

  test('solo desde o solo hasta', () => {
    expect(enRangoFecha('2026-03-10', '2026-03-15', null)).toBe(false)
    expect(enRangoFecha('2026-03-20', '2026-03-15', null)).toBe(true)
    expect(enRangoFecha('2026-03-10', null, '2026-03-15')).toBe(true)
    expect(enRangoFecha('2026-03-20', null, '2026-03-15')).toBe(false)
  })
})

describe('coincideTexto', () => {
  test('busca sin distinguir mayúsculas', () => {
    expect(coincideTexto('RENTA', 'pago de renta julio')).toBe(true)
    expect(coincideTexto('renta', 'Pago de Renta julio')).toBe(true)
  })

  test('vacío siempre coincide', () => {
    expect(coincideTexto('', 'cualquier cosa')).toBe(true)
    expect(coincideTexto('   ', null)).toBe(true)
  })

  test('descripción nula solo coincide con búsqueda vacía', () => {
    expect(coincideTexto('x', null)).toBe(false)
  })

  test('sin coincidencia se excluye', () => {
    expect(coincideTexto('luz', 'pago de renta')).toBe(false)
  })
})
