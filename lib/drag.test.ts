import { describe, expect, test } from 'bun:test'
import { buscarDestino, distanciaAlCentro, puntoEnRect } from './drag'

const rect = (left: number, top: number, ancho: number, alto: number) => ({
  left,
  top,
  right: left + ancho,
  bottom: top + alto,
})

describe('puntoEnRect', () => {
  test('detecta puntos dentro, fuera y en el borde', () => {
    const r = rect(10, 10, 100, 50)
    expect(puntoEnRect(50, 30, r)).toBe(true)
    expect(puntoEnRect(10, 10, r)).toBe(true)
    expect(puntoEnRect(110, 60, r)).toBe(true)
    expect(puntoEnRect(9, 30, r)).toBe(false)
    expect(puntoEnRect(50, 61, r)).toBe(false)
  })
})

describe('distanciaAlCentro', () => {
  test('calcula la distancia euclidiana al centro del rect', () => {
    const r = rect(0, 0, 100, 100)
    expect(distanciaAlCentro(50, 50, r)).toBe(0)
    expect(distanciaAlCentro(50 + 30, 50 + 40, r)).toBe(50)
  })
})

describe('buscarDestino', () => {
  const izquierda = { key: 'izquierda', rect: rect(0, 0, 100, 100) }
  const derecha = { key: 'derecha', rect: rect(110, 0, 100, 100) }
  const abajo = { key: 'abajo', rect: rect(0, 110, 100, 100) }

  test('lista vacía devuelve null', () => {
    expect(buscarDestino([], 10, 10)).toBeNull()
  })

  test('elige el elemento que contiene el punto', () => {
    expect(buscarDestino([izquierda, derecha, abajo], 150, 50)).toBe('derecha')
    expect(buscarDestino([izquierda, derecha, abajo], 50, 150)).toBe('abajo')
  })

  test('el destino es bidimensional: la coordenada x importa', () => {
    // Mismo rango vertical que "izquierda" pero el punto está dentro de "derecha".
    expect(buscarDestino([izquierda, derecha], 160, 50)).toBe('derecha')
    // Y viceversa: un punto a la izquierda no cae en el bloque de la derecha.
    expect(buscarDestino([izquierda, derecha], 40, 50)).toBe('izquierda')
  })

  test('sin contención directa usa el centro más cercano', () => {
    // Punto en el hueco entre izquierda y derecha, más cerca de derecha.
    expect(buscarDestino([izquierda, derecha], 108, 50)).toBe('derecha')
    // Punto muy por debajo: el más cercano verticalmente.
    expect(buscarDestino([izquierda, derecha, abajo], 50, 400)).toBe('abajo')
  })
})
