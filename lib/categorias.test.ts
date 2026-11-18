import { describe, expect, test } from 'bun:test'
import { CATEGORIAS_SUGERIDAS, normalizarNombreCategoria } from './categorias'

describe('normalizarNombreCategoria', () => {
  test('recorta espacios y colapsa espacios internos', () => {
    expect(normalizarNombreCategoria('  Comida  ')).toBe('Comida')
    expect(normalizarNombreCategoria('  Fiestas   con   amigos ')).toBe('Fiestas con amigos')
  })

  test('rechaza vacío, solo espacios y más de 40 caracteres', () => {
    expect(normalizarNombreCategoria('')).toBeNull()
    expect(normalizarNombreCategoria('   ')).toBeNull()
    expect(normalizarNombreCategoria('a'.repeat(41))).toBeNull()
  })

  test('acepta exactamente 40', () => {
    expect(normalizarNombreCategoria('a'.repeat(40))).toBe('a'.repeat(40))
  })

  test('sugerencias listas para primer uso', () => {
    expect(CATEGORIAS_SUGERIDAS).toContain('Otros')
    expect(CATEGORIAS_SUGERIDAS.length).toBeGreaterThanOrEqual(5)
  })
})
