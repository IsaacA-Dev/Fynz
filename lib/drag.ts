export interface RectBasico {
  left: number
  top: number
  right: number
  bottom: number
}

export interface ElementoArrastrable {
  key: string
  rect: RectBasico
}

export function puntoEnRect(x: number, y: number, rect: RectBasico): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

export function distanciaAlCentro(x: number, y: number, rect: RectBasico): number {
  const cx = (rect.left + rect.right) / 2
  const cy = (rect.top + rect.bottom) / 2
  return Math.hypot(cx - x, cy - y)
}

// Destino para reordenar en una cuadrícula: primero el bloque que contiene el
// puntero; si ninguno lo contiene, el de centro más cercano. Usa ambas
// coordenadas para que el reordenado horizontal funcione en grids multilínea.
export function buscarDestino(
  elementos: ElementoArrastrable[],
  x: number,
  y: number
): string | null {
  if (elementos.length === 0) return null

  const contenido = elementos.find((elemento) => puntoEnRect(x, y, elemento.rect))
  if (contenido) return contenido.key

  let mejor: string | null = null
  let mejorDistancia = Infinity
  for (const elemento of elementos) {
    const distancia = distanciaAlCentro(x, y, elemento.rect)
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia
      mejor = elemento.key
    }
  }
  return mejor
}
